"""
Test suite for verifying imported questions work correctly with DDA engine and quiz sessions
"""
from django.test import TestCase
from django.contrib.auth.models import User
from topics.models import Topic
from playthrough.models import Question, DomainRating, ResponseLog, PlaythroughSession
from playthrough.dda_engine import EquinoxDDAEngine
import json


class ImportedQuestionsBasicTests(TestCase):
    """Test that imported questions are properly structured"""
    
    def setUp(self):
        """Load sample questions from import"""
        # Get a sample of questions from each topic
        self.arithmetic_questions = Question.objects.filter(
            topic__name='Arithmetic'
        )[:5]
        
        self.algebra_questions = Question.objects.filter(
            topic__name='Algebra and Algebraic Expressions'
        )[:5]
        
        self.geometry_questions = Question.objects.filter(
            topic__name='Geometry and Spatial Reasoning'
        )[:5]
    
    def test_questions_have_required_fields(self):
        """Test that all questions have necessary fields populated"""
        all_questions = Question.objects.all()[:100]  # Test first 100
        
        for q in all_questions:
            self.assertIsNotNone(q.topic, "Question must have a topic")
            self.assertIsNotNone(q.question_text, "Question must have text")
            self.assertIsNotNone(q.question_solution, "Question must have solution")
            self.assertIsNotNone(q.correct_answer, "Question must have answer")
            self.assertIsNotNone(q.grade_level, "Question must have grade level")
            self.assertIsNotNone(q.difficulty, "Question must have difficulty")
            self.assertGreater(len(q.question_text), 0, "Question text cannot be empty")
            self.assertGreater(len(q.question_solution), 0, "Solution cannot be empty")
    
    def test_grade_levels_in_valid_range(self):
        """Test that all grade levels are between 1-10"""
        questions = Question.objects.all()
        
        for q in questions:
            self.assertGreaterEqual(q.grade_level, 1, f"Grade {q.grade_level} is below 1")
            self.assertLessEqual(q.grade_level, 10, f"Grade {q.grade_level} is above 10 (Senior High)")
    
    def test_difficulty_in_valid_range(self):
        """Test that all difficulty values are 1.0, 2.0, or 3.0"""
        questions = Question.objects.all()
        
        for q in questions:
            self.assertIn(q.difficulty, [1.0, 2.0, 3.0], 
                         f"Invalid difficulty {q.difficulty} for question {q.id}")
    
    def test_answers_extracted_correctly(self):
        """Test that answers were properly extracted from #### marker"""
        questions = Question.objects.all()[:50]
        
        for q in questions:
            # Answer should not contain #### marker
            self.assertNotIn('####', q.correct_answer, 
                           f"Answer still contains #### marker: {q.correct_answer}")
            self.assertGreater(len(q.correct_answer), 0, 
                             f"Answer is empty for question {q.id}")
    
    def test_solutions_contain_steps(self):
        """Test that solutions contain step-by-step calculations"""
        questions = Question.objects.all()[:50]
        
        for q in questions:
            # Solutions should contain calculation markers <<...>>
            has_calculations = '<<' in q.question_solution and '>>' in q.question_solution
            self.assertTrue(has_calculations, 
                          f"Solution for question {q.id} doesn't contain calculation steps")
    
    def test_topics_assigned(self):
        """Test that questions are assigned to valid topics"""
        valid_topics = [choice[0] for choice in Topic.TOPIC_CHOICES]
        questions = Question.objects.all()
        
        for q in questions:
            self.assertIn(q.topic.name, valid_topics, 
                         f"Question {q.id} has invalid topic: {q.topic.name}")


class DDATestsWithImportedQuestions(TestCase):
    """Test DDA engine functionality with imported questions"""
    
    def setUp(self):
        """Set up test user and questions"""
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.dda = EquinoxDDAEngine()
        
        # Get questions from different topics and difficulties
        self.novice_question = Question.objects.filter(
            difficulty=1.0
        ).first()
        
        self.intermediate_question = Question.objects.filter(
            difficulty=2.0
        ).first()
        
        self.advanced_question = Question.objects.filter(
            difficulty=3.0
        ).first()
        
        # Create domain ratings
        self.arithmetic_rating = DomainRating.objects.create(
            user=self.user, 
            domain_name='Arithmetic', 
            rating=2.0
        )
    
    def test_dda_with_novice_question(self):
        """Test DDA engine with Novice difficulty question"""
        if not self.novice_question:
            self.skipTest("No novice questions available")
        
        initial_rating = self.arithmetic_rating.rating
        
        # Answer correctly
        new_rating = self.dda.adjust_difficulty(
            self.user, 
            'Arithmetic', 
            self.novice_question, 
            is_correct=True
        )
        
        self.assertGreater(new_rating, initial_rating, 
                          "Correct answer should increase rating")
    
    def test_dda_with_intermediate_question(self):
        """Test DDA engine with Intermediate difficulty question"""
        if not self.intermediate_question:
            self.skipTest("No intermediate questions available")
        
        initial_rating = self.arithmetic_rating.rating
        
        # Answer incorrectly
        new_rating = self.dda.adjust_difficulty(
            self.user, 
            'Arithmetic', 
            self.intermediate_question, 
            is_correct=False
        )
        
        self.assertLess(new_rating, initial_rating, 
                       "Incorrect answer should decrease rating")
    
    def test_dda_with_advanced_question(self):
        """Test DDA engine with Advanced difficulty question"""
        if not self.advanced_question:
            self.skipTest("No advanced questions available")
        
        initial_rating = self.arithmetic_rating.rating
        
        # Answer correctly
        new_rating = self.dda.adjust_difficulty(
            self.user, 
            'Arithmetic', 
            self.advanced_question, 
            is_correct=True
        )
        
        self.assertGreater(new_rating, initial_rating, 
                          "Correct answer should increase rating")
    
    def test_response_log_created_for_imported_questions(self):
        """Test that response logs are properly created"""
        if not self.novice_question:
            self.skipTest("No questions available")
        
        # Answer a question
        self.dda.adjust_difficulty(
            self.user, 
            'Arithmetic', 
            self.novice_question, 
            is_correct=True
        )
        
        # Check log was created
        log = ResponseLog.objects.filter(
            user=self.user,
            question=self.novice_question
        ).first()
        
        self.assertIsNotNone(log, "Response log should be created")
        self.assertTrue(log.is_correct)
        self.assertEqual(log.domain, 'Arithmetic')
    
    def test_multiple_domain_ratings(self):
        """Test that DDA works across multiple domains"""
        # Create ratings for different domains
        DomainRating.objects.create(user=self.user, domain_name='Algebra', rating=1.5)
        DomainRating.objects.create(user=self.user, domain_name='Geometry', rating=2.5)
        
        # Get questions from different domains
        algebra_q = Question.objects.filter(topic__name='Algebra and Algebraic Expressions').first()
        geometry_q = Question.objects.filter(topic__name='Geometry and Spatial Reasoning').first()
        
        if algebra_q:
            # Answer algebra question correctly
            self.dda.adjust_difficulty(self.user, 'Algebra', algebra_q, is_correct=True)
            algebra_rating = DomainRating.objects.get(user=self.user, domain_name='Algebra')
            self.assertGreater(algebra_rating.rating, 1.5)
        
        if geometry_q:
            # Answer geometry question incorrectly
            self.dda.adjust_difficulty(self.user, 'Geometry', geometry_q, is_correct=False)
            geometry_rating = DomainRating.objects.get(user=self.user, domain_name='Geometry')
            self.assertLess(geometry_rating.rating, 2.5)


class QuizSessionTests(TestCase):
    """Test quiz session functionality with imported questions"""
    
    def setUp(self):
        """Set up test environment"""
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.topic = Topic.objects.first()
        
        if not self.topic:
            self.topic = Topic.objects.create(
                name='Arithmetic',
                grade_level_min=1,
                grade_level_max=6,
                description='Test topic'
            )
    
    def test_create_playthrough_session(self):
        """Test creating a playthrough session"""
        session = PlaythroughSession.objects.create(
            user=self.user,
            topic=self.topic,
            questions_served=0,
            score=0
        )
        
        self.assertIsNotNone(session.id)
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.topic, self.topic)
    
    def test_session_with_imported_questions(self):
        """Test that sessions can use imported questions"""
        # Get questions for the topic
        questions = Question.objects.filter(topic=self.topic)[:5]
        
        self.assertGreater(len(questions), 0, "Should have questions for topic")
        
        # Create session
        session = PlaythroughSession.objects.create(
            user=self.user,
            topic=self.topic,
            questions_served=0,
            score=0,
            seen_question_ids=[]
        )
        
        # Simulate serving questions
        for i, question in enumerate(questions):
            session.current_question_id = question.id
            session.questions_served = i + 1
            session.seen_question_ids.append(question.id)
            session.save()
        
        # Verify session state
        session.refresh_from_db()
        self.assertEqual(session.questions_served, 5)
        self.assertEqual(len(session.seen_question_ids), 5)
    
    def test_question_filtering_by_grade_and_difficulty(self):
        """Test filtering questions by grade level and difficulty"""
        # Test grade 3 questions
        grade3_questions = Question.objects.filter(grade_level=3)
        self.assertGreater(grade3_questions.count(), 0, "Should have Grade 3 questions")
        
        # Test difficulty 1.0 (Novice)
        novice_questions = Question.objects.filter(difficulty=1.0)
        self.assertGreater(novice_questions.count(), 0, "Should have Novice questions")
        
        # Test combined filter
        grade3_novice = Question.objects.filter(grade_level=3, difficulty=1.0)
        self.assertGreater(grade3_novice.count(), 0, "Should have Grade 3 Novice questions")
    
    def test_question_textbox_format(self):
        """Test that imported questions are in text-box format (no choices)"""
        questions = Question.objects.all()[:20]
        
        for q in questions:
            # All imported questions should have null choices
            self.assertIsNone(q.choice_a, f"Question {q.id} should not have choice_a")
            self.assertIsNone(q.choice_b, f"Question {q.id} should not have choice_b")
            self.assertIsNone(q.choice_c, f"Question {q.id} should not have choice_c")
            self.assertIsNone(q.choice_d, f"Question {q.id} should not have choice_d")
            
            # Answer should be the actual answer text, not A/B/C/D
            self.assertNotIn(q.correct_answer, ['A', 'B', 'C', 'D'], 
                           f"Question {q.id} should have text answer, not letter")


class DataIntegrityTests(TestCase):
    """Test data integrity and consistency"""
    
    def test_total_question_count(self):
        """Verify total number of imported questions"""
        count = Question.objects.count()
        self.assertGreater(count, 7000, f"Expected ~7473 questions, found {count}")
        self.assertLessEqual(count, 7500, f"Question count too high: {count}")
    
    def test_all_topics_have_questions(self):
        """Test that all topics have questions assigned"""
        topics = Topic.objects.all()
        
        for topic in topics:
            question_count = Question.objects.filter(topic=topic).count()
            self.assertGreater(question_count, 0, 
                             f"Topic {topic.name} has no questions")
    
    def test_no_orphaned_questions(self):
        """Test that all questions have valid topic references"""
        questions = Question.objects.all()
        
        for q in questions:
            self.assertIsNotNone(q.topic_id, f"Question {q.id} has no topic")
            self.assertTrue(Topic.objects.filter(id=q.topic_id).exists(), 
                          f"Question {q.id} references non-existent topic")
    
    def test_solution_field_populated(self):
        """Test that all questions have solutions"""
        empty_solutions = Question.objects.filter(
            question_solution__in=['', 'No solution provided']
        ).count()
        
        # Allow some to have default, but most should have real solutions
        total = Question.objects.count()
        percentage_with_solutions = ((total - empty_solutions) / total) * 100
        
        self.assertGreater(percentage_with_solutions, 95, 
                          f"Only {percentage_with_solutions:.1f}% of questions have solutions")
    
    def test_grade_distribution_coverage(self):
        """Test that we have questions across all grade levels"""
        for grade in range(1, 11):
            count = Question.objects.filter(grade_level=grade).count()
            self.assertGreater(count, 0, f"No questions for grade {grade}")
    
    def test_difficulty_distribution(self):
        """Test that we have questions at all difficulty levels"""
        novice_count = Question.objects.filter(difficulty=1.0).count()
        intermediate_count = Question.objects.filter(difficulty=2.0).count()
        advanced_count = Question.objects.filter(difficulty=3.0).count()
        
        self.assertGreater(novice_count, 1000, "Should have 1000+ Novice questions")
        self.assertGreater(intermediate_count, 1000, "Should have 1000+ Intermediate questions")
        self.assertGreater(advanced_count, 500, "Should have 500+ Advanced questions")


class PerformanceTests(TestCase):
    """Test performance with large question sets"""
    
    def test_query_performance_by_topic(self):
        """Test that querying by topic is performant"""
        import time
        
        start = time.time()
        questions = list(Question.objects.filter(topic__name='Arithmetic')[:100])
        elapsed = time.time() - start
        
        self.assertEqual(len(questions), 100)
        self.assertLess(elapsed, 1.0, f"Query took {elapsed:.2f}s (should be < 1s)")
    
    def test_query_performance_by_difficulty(self):
        """Test that querying by difficulty is performant"""
        import time
        
        start = time.time()
        questions = list(Question.objects.filter(difficulty=2.0)[:100])
        elapsed = time.time() - start
        
        self.assertGreater(len(questions), 0)
        self.assertLess(elapsed, 1.0, f"Query took {elapsed:.2f}s (should be < 1s)")
    
    def test_query_performance_by_grade(self):
        """Test that querying by grade level is performant"""
        import time
        
        start = time.time()
        questions = list(Question.objects.filter(grade_level=5)[:100])
        elapsed = time.time() - start
        
        self.assertGreater(len(questions), 0)
        self.assertLess(elapsed, 1.0, f"Query took {elapsed:.2f}s (should be < 1s)")


class AnswerValidationTests(TestCase):
    """Test that answers can be properly validated"""
    
    def test_numeric_answers(self):
        """Test questions with numeric answers"""
        # Find questions with numeric answers
        questions = Question.objects.all()[:200]
        
        numeric_count = 0
        for q in questions:
            try:
                float(q.correct_answer)
                numeric_count += 1
            except ValueError:
                pass
        
        self.assertGreater(numeric_count, 100, "Should have 100+ numeric answer questions")
    
    def test_text_answers(self):
        """Test questions with text answers"""
        questions = Question.objects.all()[:200]
        
        text_count = 0
        for q in questions:
            try:
                float(q.correct_answer)
            except ValueError:
                text_count += 1
        
        # Should have some text-based answers
        self.assertGreater(text_count, 0, "Should have some text-based answers")