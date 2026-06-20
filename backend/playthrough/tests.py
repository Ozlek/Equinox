from django.test import TestCase
from django.contrib.auth.models import User
from topics.models import Topic
from .models import Question, UserSkillProfile, ResponseLog, GamifiedModifier, UserInventory
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
        
        profile = UserSkillProfile.objects.get(user=self.user)
        self.assertEqual(profile.algebra_rating, 1.0)
    
    def test_seed_initial_rating_intermediate(self):
        """Test seeding with Intermediate difficulty"""
        rating = EquinoxDDAEngine.seed_initial_rating(self.user, 'Algebra', 'Intermediate')
        self.assertEqual(rating, 2.0)
        
        profile = UserSkillProfile.objects.get(user=self.user)
        self.assertEqual(profile.algebra_rating, 2.0)
    
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
        self.profile = UserSkillProfile.objects.create(user=self.user, algebra_rating=2.0)
    
    def test_rating_floor_at_1_0(self):
        """Test that ratings don't go below 1.0"""
        self.profile.update_rating('Algebra', 0.5)
        self.assertEqual(self.profile.algebra_rating, 1.0)
    
    def test_rating_ceiling_at_4_5(self):
        """Test that ratings don't exceed 4.5"""
        self.profile.update_rating('Algebra', 10.0)
        self.assertEqual(self.profile.algebra_rating, 4.5)
    
    def test_rating_exact_boundaries(self):
        """Test exact boundary values"""
        self.profile.update_rating('Algebra', 1.0)
        self.assertEqual(self.profile.algebra_rating, 1.0)
        
        self.profile.update_rating('Algebra', 4.5)
        self.assertEqual(self.profile.algebra_rating, 4.5)
    
    def test_normal_rating_update(self):
        """Test normal rating update within bounds"""
        self.profile.update_rating('Algebra', 2.5)
        self.assertEqual(self.profile.algebra_rating, 2.5)


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
        self.profile = UserSkillProfile.objects.create(user=self.user, algebra_rating=2.0)
        
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
        initial_rating = self.profile.algebra_rating
        
        new_rating = self.dda.adjust_difficulty(
            self.user, 'Algebra', self.question, is_correct=True
        )
        
        self.assertGreater(new_rating, initial_rating)
    
    def test_incorrect_answer_decreases_rating(self):
        """Test that incorrect answers decrease difficulty rating"""
        initial_rating = self.profile.algebra_rating
        
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
        initial_rating = self.profile.algebra_rating
        
        # First correct answer
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        first_rating = self.profile.algebra_rating
        
        # Second correct answer
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        second_rating = self.profile.algebra_rating
        
        # Both should be higher than initial, and streak logic should boost second
        self.assertGreater(first_rating, initial_rating)
        self.assertGreater(second_rating, first_rating)
    
    def test_rating_stays_in_bounds_after_adjustment(self):
        """Test that adjustment always keeps rating in valid bounds"""
        # Try massive correct streak
        for _ in range(10):
            self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        
        self.profile.refresh_from_db()
        self.assertLessEqual(self.profile.algebra_rating, 4.5)
        self.assertGreaterEqual(self.profile.algebra_rating, 1.0)


class StreakDetectionTests(TestCase):
    """Test rule-based thresholding (streak detection)"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra basics'
        )
        self.profile = UserSkillProfile.objects.create(user=self.user, algebra_rating=2.0)
        
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
        initial = self.profile.algebra_rating
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        
        boost = self.profile.algebra_rating - initial
        self.assertLess(boost, 0.2)
    
    def test_streak_of_two_increased_boost(self):
        """Test that 2-question streak provides better boost"""
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        initial = self.profile.algebra_rating
        
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        
        boost = self.profile.algebra_rating - initial
        self.assertGreater(boost, 0.1)


class UserSkillProfileTests(TestCase):
    """Test UserSkillProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.profile = UserSkillProfile.objects.create(user=self.user)
    
    def test_get_rating_algebra(self):
        """Test retrieving Algebra rating"""
        self.assertEqual(self.profile.get_rating('Algebra'), 1.0)
    
    def test_get_rating_all_domains(self):
        """Test retrieving all domain ratings"""
        self.assertEqual(self.profile.get_rating('Arithmetic'), 1.0)
        self.assertEqual(self.profile.get_rating('Geometry'), 1.0)
        self.assertEqual(self.profile.get_rating('Statistics'), 1.0)
        self.assertEqual(self.profile.get_rating('Trigonometry'), 1.0)
    
    def test_get_rating_invalid_domain_fallback(self):
        """Test that invalid domain returns fallback"""
        self.assertEqual(self.profile.get_rating('InvalidDomain'), 1.0)
    
    def test_update_rating_persistence(self):
        """Test that rating updates are saved"""
        self.profile.update_rating('Algebra', 3.5)
        
        # Fetch fresh from DB
        fresh = UserSkillProfile.objects.get(user=self.user)
        self.assertEqual(fresh.algebra_rating, 3.5)


class GamifiedModifierTests(TestCase):
    """Test gamification modifier system"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.modifier = GamifiedModifier.objects.create(
            name='Double XP',
            slug='double-xp',
            modifier_type='SCORE_BOOST',
            multiplier_value=2.0,
            description='Doubles score points'
        )
    
    def test_modifier_creation(self):
        """Test that modifier is created correctly"""
        self.assertEqual(self.modifier.name, 'Double XP')
        self.assertEqual(self.modifier.multiplier_value, 2.0)
    
    def test_inventory_creation(self):
        """Test adding modifier to user inventory"""
        inventory = UserInventory.objects.create(
            user=self.user,
            modifier=self.modifier,
            quantity=5
        )
        
        self.assertEqual(inventory.quantity, 5)
    
    def test_inventory_uniqueness(self):
        """Test that user can only have one inventory per modifier"""
        UserInventory.objects.create(
            user=self.user,
            modifier=self.modifier,
            quantity=1
        )
        
        # This should fail due to unique_together constraint
        with self.assertRaises(Exception):
            UserInventory.objects.create(
                user=self.user,
                modifier=self.modifier,
                quantity=2
            )
    
    def test_modifier_str_representation(self):
        """Test modifier string representation"""
        self.assertIn('Double XP', str(self.modifier))


class QuestionModelTests(TestCase):
    """Test Question model"""
    
    def setUp(self):
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra basics'
        )
    
    def test_multiple_choice_question_creation(self):
        """Test MCQ creation with all options"""
        question = Question.objects.create(
            topic=self.topic,
            question_text='What is 5 × 3?',
            choice_a='10', choice_b='15', choice_c='20', choice_d='25',
            correct_answer='B',
            difficulty='Novice'
        )
        
        self.assertEqual(question.choice_a, '10')
        self.assertEqual(question.correct_answer, 'B')
    
    def test_text_box_question_creation(self):
        """Test text-box question creation"""
        question = Question.objects.create(
            topic=self.topic,
            question_text='Calculate 7 + 8',
            choice_a='', choice_b='', choice_c='', choice_d='',
            correct_answer='15',
            difficulty='Novice'
        )
        
        self.assertEqual(question.correct_answer, '15')
        self.assertEqual(question.choice_a, '')


class IntegrationTests(TestCase):
    """End-to-end integration tests"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Geometry',
            grade_level='Junior High',
            description='Geometry basics'
        )
        
        self.easy_question = Question.objects.create(
            topic=self.topic,
            question_text='Easy question',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='A',
            difficulty='Novice'
        )
        
        self.hard_question = Question.objects.create(
            topic=self.topic,
            question_text='Hard question',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='B',
            difficulty='Expert'
        )
        
        self.dda = EquinoxDDAEngine()
    
    def test_full_session_difficulty_progression(self):
        """Test that user difficulty adapts through a session"""
        # Start at Intermediate
        EquinoxDDAEngine.seed_initial_rating(self.user, 'Geometry', 'Intermediate')
        self.profile = UserSkillProfile.objects.get(user=self.user)
        initial = self.profile.geometry_rating
        
        # Correct answers should increase difficulty
        for _ in range(3):
            self.dda.adjust_difficulty(self.user, 'Geometry', self.easy_question, is_correct=True)
        
        self.profile.refresh_from_db()
        after_correct = self.profile.geometry_rating
        
        # Incorrect answers should decrease
        for _ in range(2):
            self.dda.adjust_difficulty(self.user, 'Geometry', self.hard_question, is_correct=False)
        
        self.profile.refresh_from_db()
        after_incorrect = self.profile.geometry_rating
        
        # Verify progression
        self.assertGreater(after_correct, initial)
        self.assertLess(after_incorrect, after_correct)
    
    def test_response_log_history(self):
        """Test that complete response history is tracked"""
        self.dda.adjust_difficulty(self.user, 'Geometry', self.easy_question, is_correct=True)
        self.dda.adjust_difficulty(self.user, 'Geometry', self.hard_question, is_correct=False)
        self.dda.adjust_difficulty(self.user, 'Geometry', self.easy_question, is_correct=True)
        
        logs = ResponseLog.objects.filter(user=self.user, domain='Geometry').order_by('timestamp')
        
        self.assertEqual(logs.count(), 3)
        self.assertTrue(logs[0].is_correct)
        self.assertFalse(logs[1].is_correct)
        self.assertTrue(logs[2].is_correct)


class RatingBoundsTests(TestCase):
    """Test that ratings stay within valid bounds"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.profile = UserSkillProfile.objects.create(user=self.user, algebra_rating=2.0)
    
    def test_rating_floor_at_1_0(self):
        """Test that ratings don't go below 1.0"""
        self.profile.update_rating('Algebra', 0.5)
        self.assertEqual(self.profile.algebra_rating, 1.0)
    
    def test_rating_ceiling_at_4_5(self):
        """Test that ratings don't exceed 4.5"""
        self.profile.update_rating('Algebra', 10.0)
        self.assertEqual(self.profile.algebra_rating, 4.5)
    
    def test_rating_exact_boundaries(self):
        """Test exact boundary values"""
        self.profile.update_rating('Algebra', 1.0)
        self.assertEqual(self.profile.algebra_rating, 1.0)
        
        self.profile.update_rating('Algebra', 4.5)
        self.assertEqual(self.profile.algebra_rating, 4.5)
    
    def test_normal_rating_update(self):
        """Test normal rating update within bounds"""
        self.profile.update_rating('Algebra', 2.5)
        self.assertEqual(self.profile.algebra_rating, 2.5)


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
        self.profile = UserSkillProfile.objects.create(user=self.user, algebra_rating=2.0)
        
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
        initial_rating = self.profile.algebra_rating
        
        new_rating = self.dda.adjust_difficulty(
            self.user, 'Algebra', self.question, is_correct=True
        )
        
        self.assertGreater(new_rating, initial_rating)
    
    def test_incorrect_answer_decreases_rating(self):
        """Test that incorrect answers decrease difficulty rating"""
        initial_rating = self.profile.algebra_rating
        
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
        initial_rating = self.profile.algebra_rating
        
        # First correct answer
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        first_rating = self.profile.algebra_rating
        
        # Second correct answer
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        second_rating = self.profile.algebra_rating
        
        # Both should be higher than initial, and streak logic should boost second
        self.assertGreater(first_rating, initial_rating)
        self.assertGreater(second_rating, first_rating)
    
    def test_rating_stays_in_bounds_after_adjustment(self):
        """Test that adjustment always keeps rating in valid bounds"""
        # Try massive correct streak
        for _ in range(10):
            self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        
        self.profile.refresh_from_db()
        self.assertLessEqual(self.profile.algebra_rating, 4.5)
        self.assertGreaterEqual(self.profile.algebra_rating, 1.0)


class StreakDetectionTests(TestCase):
    """Test rule-based thresholding (streak detection)"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra basics'
        )
        self.profile = UserSkillProfile.objects.create(user=self.user, algebra_rating=2.0)
        
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
        initial = self.profile.algebra_rating
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        
        boost = self.profile.algebra_rating - initial
        self.assertLess(boost, 0.2)
    
    def test_streak_of_two_increased_boost(self):
        """Test that 2-question streak provides better boost"""
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        initial = self.profile.algebra_rating
        
        self.dda.adjust_difficulty(self.user, 'Algebra', self.question, is_correct=True)
        self.profile.refresh_from_db()
        
        boost = self.profile.algebra_rating - initial
        self.assertGreater(boost, 0.1)


class UserSkillProfileTests(TestCase):
    """Test UserSkillProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.profile = UserSkillProfile.objects.create(user=self.user)
    
    def test_get_rating_algebra(self):
        """Test retrieving Algebra rating"""
        self.assertEqual(self.profile.get_rating('Algebra'), 1.0)
    
    def test_get_rating_all_domains(self):
        """Test retrieving all domain ratings"""
        self.assertEqual(self.profile.get_rating('Arithmetic'), 1.0)
        self.assertEqual(self.profile.get_rating('Geometry'), 1.0)
        self.assertEqual(self.profile.get_rating('Statistics'), 1.0)
        self.assertEqual(self.profile.get_rating('Trigonometry'), 1.0)
    
    def test_get_rating_invalid_domain_fallback(self):
        """Test that invalid domain returns fallback"""
        self.assertEqual(self.profile.get_rating('InvalidDomain'), 1.0)
    
    def test_update_rating_persistence(self):
        """Test that rating updates are saved"""
        self.profile.update_rating('Algebra', 3.5)
        
        # Fetch fresh from DB
        fresh = UserSkillProfile.objects.get(user=self.user)
        self.assertEqual(fresh.algebra_rating, 3.5)


class GamifiedModifierTests(TestCase):
    """Test gamification modifier system"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.modifier = GamifiedModifier.objects.create(
            name='Double XP',
            slug='double-xp',
            modifier_type='SCORE_BOOST',
            multiplier_value=2.0,
            description='Doubles score points'
        )
    
    def test_modifier_creation(self):
        """Test that modifier is created correctly"""
        self.assertEqual(self.modifier.name, 'Double XP')
        self.assertEqual(self.modifier.multiplier_value, 2.0)
    
    def test_inventory_creation(self):
        """Test adding modifier to user inventory"""
        inventory = UserInventory.objects.create(
            user=self.user,
            modifier=self.modifier,
            quantity=5
        )
        
        self.assertEqual(inventory.quantity, 5)
    
    def test_inventory_uniqueness(self):
        """Test that user can only have one inventory per modifier"""
        UserInventory.objects.create(
            user=self.user,
            modifier=self.modifier,
            quantity=1
        )
        
        # This should fail due to unique_together constraint
        with self.assertRaises(Exception):
            UserInventory.objects.create(
                user=self.user,
                modifier=self.modifier,
                quantity=2
            )
    
    def test_modifier_str_representation(self):
        """Test modifier string representation"""
        self.assertIn('Double XP', str(self.modifier))


class QuestionModelTests(TestCase):
    """Test Question model"""
    
    def setUp(self):
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra basics'
        )
    
    def test_multiple_choice_question_creation(self):
        """Test MCQ creation with all options"""
        question = Question.objects.create(
            topic=self.topic,
            question_text='What is 5 × 3?',
            choice_a='10', choice_b='15', choice_c='20', choice_d='25',
            correct_answer='B',
            difficulty='Novice'
        )
        
        self.assertEqual(question.choice_a, '10')
        self.assertEqual(question.correct_answer, 'B')
    
    def test_text_box_question_creation(self):
        """Test text-box question creation"""
        question = Question.objects.create(
            topic=self.topic,
            question_text='Calculate 7 + 8',
            choice_a='', choice_b='', choice_c='', choice_d='',
            correct_answer='15',
            difficulty='Novice'
        )
        
        self.assertEqual(question.correct_answer, '15')
        self.assertEqual(question.choice_a, '')


class IntegrationTests(TestCase):
    """End-to-end integration tests"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.create(
            name='Geometry',
            grade_level='Junior High',
            description='Geometry basics'
        )
        
        self.easy_question = Question.objects.create(
            topic=self.topic,
            question_text='Easy question',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='A',
            difficulty='Novice'
        )
        
        self.hard_question = Question.objects.create(
            topic=self.topic,
            question_text='Hard question',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='B',
            difficulty='Expert'
        )
        
        self.dda = EquinoxDDAEngine()
    
    def test_full_session_difficulty_progression(self):
        """Test that user difficulty adapts through a session"""
        # Start at Intermediate
        EquinoxDDAEngine.seed_initial_rating(self.user, 'Geometry', 'Intermediate')
        self.profile = UserSkillProfile.objects.get(user=self.user)
        initial = self.profile.geometry_rating
        
        # Correct answers should increase difficulty
        for _ in range(3):
            self.dda.adjust_difficulty(self.user, 'Geometry', self.easy_question, is_correct=True)
        
        self.profile.refresh_from_db()
        after_correct = self.profile.geometry_rating
        
        # Incorrect answers should decrease
        for _ in range(2):
            self.dda.adjust_difficulty(self.user, 'Geometry', self.hard_question, is_correct=False)
        
        self.profile.refresh_from_db()
        after_incorrect = self.profile.geometry_rating
        
        # Verify progression
        self.assertGreater(after_correct, initial)
        self.assertLess(after_incorrect, after_correct)
    
    def test_response_log_history(self):
        """Test that complete response history is tracked"""
        self.dda.adjust_difficulty(self.user, 'Geometry', self.easy_question, is_correct=True)
        self.dda.adjust_difficulty(self.user, 'Geometry', self.hard_question, is_correct=False)
        self.dda.adjust_difficulty(self.user, 'Geometry', self.easy_question, is_correct=True)
        
        logs = ResponseLog.objects.filter(user=self.user, domain='Geometry').order_by('timestamp')
        
        self.assertEqual(logs.count(), 3)
        self.assertTrue(logs[0].is_correct)
        self.assertFalse(logs[1].is_correct)
        self.assertTrue(logs[2].is_correct)
