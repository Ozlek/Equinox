from django.test import TestCase
from django.contrib.auth.models import User
from topics.models import Topic
from .models import Question, DomainRating, ResponseLog, GamifiedModifier, UserInventory
from .dda_engine import EquinoxDDAEngine
import math


class DDAEngineInitializationTests(TestCase):
    """Test DDA Engine seeding and initial setup"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Basic algebra concepts'
        )
    
    def test_seed_initial_rating_novice(self):
        """Test seeding with Novice difficulty"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'Novice')
        self.assertEqual(rating, 1.0)
        
        domain_rating = DomainRating.objects.get(user=self.user, domain_name='Algebra')
        self.assertEqual(domain_rating.rating, 1.0)
    
    def test_seed_initial_rating_intermediate(self):
        """Test seeding with Intermediate difficulty"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'Intermediate')
        self.assertEqual(rating, 2.0)
        
        domain_rating = DomainRating.objects.get(user=self.user, domain_name='Algebra')
        self.assertEqual(domain_rating.rating, 2.0)
    
    def test_seed_initial_rating_advanced(self):
        """Test seeding with Advanced difficulty"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'Advanced')
        self.assertEqual(rating, 3.0)
    
    def test_seed_initial_rating_expert(self):
        """Test seeding with Expert difficulty"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'Expert')
        self.assertEqual(rating, 4.0)
    
    def test_seed_initial_rating_case_insensitive(self):
        """Test that seeding handles lowercase input"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'novice')
        self.assertEqual(rating, 1.0)
    
    def test_seed_initial_rating_invalid_fallback(self):
        """Test that invalid difficulty falls back to Intermediate"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'InvalidDifficulty')
        self.assertEqual(rating, 2.0)


class RatingBoundsTests(TestCase):
    """Test that ratings stay within valid bounds"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.domain_rating = DomainRating.objects.create(user=self.user, domain_name='Algebra', rating=2.0)
    
    def test_rating_floor_at_1_0(self):
        """Test that ratings don't go below 1.0"""
        dda = EquinoxDDAEngine()
        dda.update_rating(self.user, 'Algebra', 0.5)
        self.domain_rating.refresh_from_db()
        self.assertEqual(self.domain_rating.rating, 1.0)
    
    def test_rating_ceiling_at_4_5(self):
        """Test that ratings don't exceed 4.5"""
        dda = EquinoxDDAEngine()
        dda.update_rating(self.user, 'Algebra', 10.0)
        self.domain_rating.refresh_from_db()
        self.assertEqual(self.domain_rating.rating, 4.5)
    
    def test_rating_exact_boundaries(self):
        """Test exact boundary values"""
        dda = EquinoxDDAEngine()
        dda.update_rating(self.user, 'Algebra', 1.0)
        self.domain_rating.refresh_from_db()
        self.assertEqual(self.domain_rating.rating, 1.0)
        
        dda.update_rating(self.user, 'Algebra', 4.5)
        self.domain_rating.refresh_from_db()
        self.assertEqual(self.domain_rating.rating, 4.5)
    
    def test_normal_rating_update(self):
        """Test normal rating update within bounds"""
        dda = EquinoxDDAEngine()
        dda.update_rating(self.user, 'Algebra', 2.5)
        self.domain_rating.refresh_from_db()
        self.assertEqual(self.domain_rating.rating, 2.5)


class DifficultyTierConversionTests(TestCase):
    """Test conversion between numeric ratings and tier names"""
    
    def test_get_closest_tier_novice(self):
        """Test tier detection at Novice threshold"""
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(1.0), "Novice")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(1.5), "Novice")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(1.7), "Novice")
    
    def test_get_closest_tier_intermediate(self):
        """Test tier detection at Intermediate threshold"""
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(1.8), "Intermediate")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(2.0), "Intermediate")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(2.7), "Intermediate")
    
    def test_get_closest_tier_advanced(self):
        """Test tier detection at Advanced threshold"""
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(2.8), "Advanced")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(3.0), "Advanced")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(3.7), "Advanced")
    
    def test_get_closest_tier_expert(self):
        """Test tier detection at Expert threshold"""
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(3.8), "Expert")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(4.0), "Expert")
        self.assertEqual(EquinoxDDAEngine.get_closest_tier(4.5), "Expert")


class DifficultyAdjustmentTests(TestCase):
    """Test difficulty adjustment logic (core DDA engine)"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra basics'
        )
        self.domain_rating = DomainRating.objects.create(user=self.user, domain_name='Algebra', rating=2.0)
        
        self.question = Question.objects.create(
            topic=self.topic,
            question_text='What is 2 + 2?',
            choice_a='1', choice_b='2', choice_c='3', choice_d='4',
            correct_answer='D',
            difficulty='Intermediate'
        )
        
        self.dda = EquinoxDDAEngine()
    
    def test_correct_answer_increases_rating(self):
        """Test that correct answers increase difficulty rating"""
        initial_rating = self.domain_rating.rating
        
        new_rating = self.dda.adjust_difficulty(
            self.user, 'Algebra', self.question, is_correct=True
        )
        
        self.assertGreater(new_rating, initial_rating)
    
    def test_incorrect_answer_decreases_rating(self):
        """Test that incorrect answers decrease difficulty rating"""
        initial_rating = self.domain_rating.rating
        
        new_rating = self.dda.adjust_difficulty(
            self.user, 'Algebra', self.question, is_correct=False
        )
        
        self.assertLess(new_rating, initial_rating)
    
    def test_response_log_created(self):
        """Test that answer attempts are logged"""
        self.dda.adjust_difficulty(
            self.user, 'Algebra', self.question, is_correct=True
        )
        
        log = ResponseLog.objects.get(user=self.user, question=self.question)
        self.assertTrue(log.is_correct)
        self.assertEqual(log.domain, 'Algebra')
    
    def test_multiple_adjustments_compound(self):
        """Test that multiple correct answers result in larger rating increase"""
        initial_rating = self.domain_rating.rating
        
        # First correct answer
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.domain_rating.refresh_from_db()
        first_rating = self.domain_rating.rating
        
        # Second correct answer
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.domain_rating.refresh_from_db()
        second_rating = self.domain_rating.rating
        
        # Both should be higher than initial, and streak logic should boost second
        self.assertGreater(first_rating, initial_rating)
        self.assertGreater(second_rating, first_rating)
    
    def test_rating_stays_in_bounds_after_adjustment(self):
        """Test that adjustment always keeps rating in valid bounds"""
        # Try massive correct streak
        for _ in range(10):
            self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        
        self.domain_rating.refresh_from_db()
        self.assertLessEqual(self.domain_rating.rating, 4.5)
        self.assertGreaterEqual(self.domain_rating.rating, 1.0)


class StreakDetectionTests(TestCase):
    """Test rule-based thresholding (streak detection)"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra basics'
        )
        self.domain_rating = DomainRating.objects.create(user=self.user, domain_name='Algebra', rating=2.0)
        
        self.question = Question.objects.create(
            topic=self.topic,
            question_text='Test question',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='A',
            difficulty='Intermediate'
        )
        
        self.dda = EquinoxDDAEngine()
    
    def test_no_streak_minimal_boost(self):
        """Test that first correct answer gives minimal boost"""
        initial = self.domain_rating.rating
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.domain_rating.refresh_from_db()
        
        boost = self.domain_rating.rating - initial
        self.assertLess(boost, 0.2)
    
    def test_streak_of_two_increased_boost(self):
        """Test that 2-question streak provides better boost"""
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.domain_rating.refresh_from_db()
        initial = self.domain_rating.rating
        
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.domain_rating.refresh_from_db()
        
        boost = self.domain_rating.rating - initial
        self.assertGreater(boost, 0.1)


class DomainRatingTests(TestCase):
    """Test DomainRating model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.domain_rating = DomainRating.objects.create(user=self.user, domain_name='Algebra', rating=2.0)
    
    def test_get_rating_algebra(self):
        """Test retrieving Algebra rating"""
        self.assertEqual(self.domain_rating.rating, 2.0)
    
    def test_unique_together_constraint(self):
        """Test that user+domain combination is unique"""
        with self.assertRaises(Exception):
            DomainRating.objects.create(user=self.user, domain_name='Algebra', rating=3.0)
    
    def test_multiple_domains_per_user(self):
        """Test that a user can have ratings for multiple domains"""
        DomainRating.objects.create(user=self.user, domain_name='Geometry', rating=1.5)
        
        algebra_rating = DomainRating.objects.get(user=self.user, domain_name='Algebra')
        geometry_rating = DomainRating.objects.get(user=self.user, domain_name='Geometry')
        
        self.assertEqual(algebra_rating.rating, 2.0)
        self.assertEqual(geometry_rating.rating, 1.5)