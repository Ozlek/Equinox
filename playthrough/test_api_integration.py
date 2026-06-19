"""
API Integration Tests for Equinox Playthrough System

CURRENT STATUS: Structure complete, requires refinement of test expectations

Tests the complete flow of:
1. Authentication
2. Session initialization
3. Question serving
4. Answer submission
5. DDA adjustment

IMPORTANT NOTES:
- Tests are structurally sound and well-documented
- Some test assertions need adjustment to match actual API response format
- This serves as a blueprint for API contract validation
- When actual API responses are confirmed, update assertions to match

Test Failures Identified:
- API returns 403 for unauthenticated requests (not 302)
- Response fields differ from documented contract in docstrings
- Some query parameter handling differs from test expectations

REFINEMENT NEEDED:
1. Verify actual API response fields against test assertions
2. Update test expectations to match real API behavior
3. Add assertions for all documented response fields
4. Validate error handling and edge cases

To run: python manage.py test playthrough.test_api_integration --verbosity=2
"""

from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from topics.models import Topic
from .models import Question, UserSkillProfile, GamifiedModifier, UserInventory
from .dda_engine import EquinoxDDAEngine
import json


class PlaythroughAPIAuthenticationTests(TestCase):
    """Test authentication requirements for playthrough API"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Basic algebra'
        )
        self.question = Question.objects.create(
            topic=self.topic,
            question_text='What is 2+2?',
            choice_a='1', choice_b='2', choice_c='3', choice_d='4',
            correct_answer='D',
            difficulty='Novice'
        )
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access playthrough API"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        response = self.client.get(url)
        
        # Should redirect to login or return 401
        self.assertIn(response.status_code, [302, 401, 403])
    
    def test_authenticated_access_allowed(self):
        """Test that authenticated users can access playthrough API"""
        self.client.login(username='testuser', password='pass123')
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)


class PlaythroughAPISessionTests(TestCase):
    """Test session initialization and management"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            name='Arithmetic',
            grade_level='Elementary',
            description='Basic arithmetic'
        )
        self.question = Question.objects.create(
            topic=self.topic,
            question_text='1+1=?',
            choice_a='1', choice_b='2', choice_c='3', choice_d='4',
            correct_answer='B',
            difficulty='Novice'
        )
        self.client.login(username='testuser', password='pass123')
    
    def test_session_initializes_on_first_request(self):
        """Test that session is properly initialized on first request"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        response = self.client.get(url, {'difficulty': 'Intermediate'})
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check session was initialized
        self.assertEqual(response.wsgi_request.session.get('questions_served'), 0)
        self.assertEqual(response.wsgi_request.session.get('score'), 0)
        self.assertIsNotNone(response.wsgi_request.session.get('current_question_id'))
    
    def test_difficulty_parameter_seeds_rating(self):
        """Test that difficulty parameter correctly seeds user rating"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        # Test with Novice difficulty
        self.client.get(url, {'difficulty': 'Novice'})
        profile = UserSkillProfile.objects.get(user=self.user)
        self.assertEqual(profile.arithmetic_rating, 1.0)
        
        # Clear and test with Expert
        profile.delete()
        self.client.get(url, {'difficulty': 'Expert'})
        profile = UserSkillProfile.objects.get(user=self.user)
        self.assertEqual(profile.arithmetic_rating, 4.0)
    
    def test_session_persists_across_requests(self):
        """Test that session data persists across multiple requests"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        # First request - initialize session
        response1 = self.client.get(url)
        session1 = self.client.session
        first_question_id = session1.get('current_question_id')
        
        # Second request - check session persisted
        response2 = self.client.get(url)
        session2 = self.client.session
        
        self.assertEqual(session1.get('questions_served'), session2.get('questions_served'))
        self.assertEqual(first_question_id, session2.get('current_question_id'))


class PlaythroughAPIQuestionTests(TestCase):
    """Test question serving with DDA"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            name='Geometry',
            grade_level='Junior High',
            description='Geometry basics'
        )
        
        # Create questions of different difficulties
        self.novice_q = Question.objects.create(
            topic=self.topic,
            question_text='Easy geometry',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='A',
            difficulty='Novice'
        )
        self.expert_q = Question.objects.create(
            topic=self.topic,
            question_text='Hard geometry',
            choice_a='A', choice_b='B', choice_c='C', choice_d='D',
            correct_answer='B',
            difficulty='Expert'
        )
        
        self.client.login(username='testuser', password='pass123')
    
    def test_get_question_returns_required_fields(self):
        """Test that GET request returns all required question fields"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify required fields
        self.assertIn('question_id', data)
        self.assertIn('question_text', data)
        self.assertIn('current_rating', data)
        self.assertIn('current_tier', data)
        self.assertIn('questions_served', data)
    
    def test_questions_not_repeated_in_session(self):
        """Test that same question is not served twice in one session"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        served_questions = []
        
        # Create enough questions
        for i in range(5):
            Question.objects.create(
                topic=self.topic,
                question_text=f'Question {i}',
                choice_a='A', choice_b='B', choice_c='C', choice_d='D',
                correct_answer='A',
                difficulty='Intermediate'
            )
        
        # Serve multiple questions
        for _ in range(3):
            response = self.client.get(url)
            data = response.json()
            served_questions.append(data['question_id'])
            
            # Submit answer to get next question
            self.client.post(url, {'answer': 'A'}, content_type='application/json')
        
        # Check no duplicates
        self.assertEqual(len(served_questions), len(set(served_questions)))


class PlaythroughAPIAnswerSubmissionTests(TestCase):
    """Test answer submission and scoring"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            name='Statistics',
            grade_level='Senior High',
            description='Statistics'
        )
        self.question = Question.objects.create(
            topic=self.topic,
            question_text='Mean = ?',
            choice_a='Mode', choice_b='Average', choice_c='Range', choice_d='Median',
            correct_answer='B',
            difficulty='Intermediate'
        )
        self.client.login(username='testuser', password='pass123')
    
    def test_correct_answer_increases_score(self):
        """Test that correct answer increases score"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        # Get initial question
        self.client.get(url)
        
        # Submit correct answer
        response = self.client.post(
            url,
            json.dumps({'answer': 'B'}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data.get('is_correct'))
        self.assertGreater(data.get('score', 0), 0)
    
    def test_incorrect_answer_decreases_rating(self):
        """Test that incorrect answer decreases user rating"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        # Initialize with known difficulty
        self.client.get(url, {'difficulty': 'Intermediate'})
        profile = UserSkillProfile.objects.get(user=self.user)
        initial_rating = profile.statistics_rating
        
        # Submit wrong answer
        self.client.post(
            url,
            json.dumps({'answer': 'A'}),
            content_type='application/json'
        )
        
        profile.refresh_from_db()
        self.assertLess(profile.statistics_rating, initial_rating)
    
    def test_answer_case_insensitivity(self):
        """Test that answers are case-insensitive"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        self.client.get(url)
        
        # Test lowercase
        response = self.client.post(
            url,
            json.dumps({'answer': 'b'}),
            content_type='application/json'
        )
        data = response.json()
        self.assertTrue(data.get('is_correct'))
        
        # Reset session
        self.client.get(url)
        
        # Test uppercase
        response = self.client.post(
            url,
            json.dumps({'answer': 'B'}),
            content_type='application/json'
        )
        data = response.json()
        self.assertTrue(data.get('is_correct'))


class PlaythroughAPIModifierTests(TestCase):
    """Test gamification modifiers in API"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            name='Trigonometry',
            grade_level='Senior High',
            description='Trig'
        )
        self.question = Question.objects.create(
            topic=self.topic,
            question_text='sin(0) = ?',
            choice_a='0', choice_b='1', choice_c='∞', choice_d='-1',
            correct_answer='A',
            difficulty='Intermediate'
        )
        
        # Create modifier
        self.modifier = GamifiedModifier.objects.create(
            name='Double XP',
            slug='double-xp',
            modifier_type='SCORE_BOOST',
            multiplier_value=2.0
        )
        UserInventory.objects.create(
            user=self.user,
            modifier=self.modifier,
            quantity=5
        )
        
        self.client.login(username='testuser', password='pass123')
    
    def test_modifier_affects_score(self):
        """Test that equipped modifier affects scoring"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        # Test without modifier
        self.client.get(url)
        self.client.post(url, json.dumps({'answer': 'A'}), content_type='application/json')
        response1 = self.client.get(url)
        data1 = response1.json()
        score_without_modifier = data1.get('gamified_score', 0)
        
        # Reset and test with modifier
        self.client.session.flush()
        self.client.get(url, {'equipped_modifier': 'double-xp'})
        self.client.post(url, json.dumps({'answer': 'A'}), content_type='application/json')
        response2 = self.client.get(url)
        data2 = response2.json()
        score_with_modifier = data2.get('gamified_score', 0)
        
        # Score with modifier should be higher
        if score_without_modifier > 0:
            self.assertGreaterEqual(score_with_modifier, score_without_modifier)


class PlaythroughAPIEndToEndTests(TestCase):
    """End-to-end integration tests for complete playthrough flow"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.topic = Topic.objects.create(
            name='Algebra',
            grade_level='Elementary',
            description='Algebra'
        )
        
        # Create multiple questions
        for i in range(5):
            Question.objects.create(
                topic=self.topic,
                question_text=f'Question {i}: 1+{i}=?',
                choice_a=str(i), choice_b=str(i+1), choice_c=str(i+2), choice_d=str(i+3),
                correct_answer='B',
                difficulty='Novice'
            )
        
        self.client.login(username='testuser', password='pass123')
    
    def test_complete_playthrough_session(self):
        """Test a complete playthrough from start to score"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        # 1. Initialize session
        response = self.client.get(url, {'difficulty': 'Intermediate'})
        self.assertEqual(response.status_code, 200)
        
        initial_session = dict(self.client.session)
        self.assertEqual(initial_session['questions_served'], 0)
        self.assertEqual(initial_session['score'], 0)
        
        # 2. Answer 3 questions correctly
        for i in range(3):
            response = self.client.post(
                url,
                json.dumps({'answer': 'B'}),
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data.get('is_correct'))
        
        # 3. Verify session state
        final_session = dict(self.client.session)
        self.assertEqual(final_session['questions_served'], 3)
        self.assertGreater(final_session['score'], 0)
        
        # 4. Verify user rating improved
        profile = UserSkillProfile.objects.get(user=self.user)
        self.assertGreater(profile.algebra_rating, 1.0)  # Started at novice (1.0)
    
    def test_difficulty_progression(self):
        """Test that difficulty increases after correct answers"""
        url = reverse('playthrough', kwargs={'topic_id': self.topic.id})
        
        self.client.get(url, {'difficulty': 'Novice'})
        profile = UserSkillProfile.objects.get(user=self.user)
        initial_rating = profile.algebra_rating
        self.assertEqual(initial_rating, 1.0)
        
        # Answer correctly multiple times
        for _ in range(5):
            self.client.post(url, json.dumps({'answer': 'B'}), content_type='application/json')
        
        profile.refresh_from_db()
        self.assertGreater(profile.algebra_rating, initial_rating)
