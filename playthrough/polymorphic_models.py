"""
Polymorphic Question Models (Ready for Migration)

This demonstrates the proper polymorphic design for question types.
These models can be adopted gradually alongside the existing Question model.

To migrate from current Question model to this design:

1. Copy this code into a new models file or append to models.py
2. Create migration: python manage.py makemigrations
3. Run migration: python manage.py migrate
4. Gradually update code to use new models
5. Plan data migration for existing questions

USAGE EXAMPLES
==============

Creating MCQ:
    q = MultipleChoiceQuestion.objects.create(
        topic=algebra_topic,
        question_text='What is 2+2?',
        grade_level='Elementary',
        difficulty='Novice',
        choice_a='1', choice_b='2', choice_c='3', choice_d='4',
        correct_choice='B'
    )

Creating TextBox:
    q = TextBoxQuestion.objects.create(
        topic=algebra_topic,
        question_text='Calculate 7+8',
        grade_level='Elementary',
        difficulty='Novice',
        correct_answer='15',
        accept_fuzzy=False
    )

Querying:
    # Get all MCQ questions
    mcq_questions = MultipleChoiceQuestion.objects.filter(difficulty='Expert')
    
    # Get all questions of any type
    all_questions = BaseQuestion.objects.all()
    
    # Get specific question with type detection
    q = BaseQuestion.objects.get(id=5)
    if isinstance(q.child, MultipleChoiceQuestion):
        print(f"Choices: {q.child.get_choices()}")
"""

from django.db import models
from django.contrib.auth.models import User
from topics.models import Topic


class BaseQuestion(models.Model):
    """
    Abstract base for all question types.
    Common fields shared across all question types.
    """
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='base_questions')
    question_text = models.TextField()
    
    grade_level = models.CharField(
        max_length=50,
        choices=[('Elementary', 'Elementary'), ('Junior High', 'Junior High'), ('Senior High', 'Senior High')],
        default='Elementary'
    )
    difficulty = models.CharField(
        max_length=20,
        choices=[('Novice', 'Novice'), ('Intermediate', 'Intermediate'), ('Advanced', 'Advanced'), ('Expert', 'Expert')],
        default='Intermediate'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
    
    def __str__(self):
        return self.question_text[:50]
    
    def get_correct_answer(self):
        """Override in subclasses"""
        raise NotImplementedError("Subclasses must implement get_correct_answer()")
    
    def validate_answer(self, user_answer):
        """Override in subclasses"""
        raise NotImplementedError("Subclasses must implement validate_answer()")


class MultipleChoiceQuestion(BaseQuestion):
    """
    Multiple Choice Question (MCQ) with 4 options.
    One and only one correct answer.
    """
    choice_a = models.CharField(max_length=255, verbose_name='Option A')
    choice_b = models.CharField(max_length=255, verbose_name='Option B')
    choice_c = models.CharField(max_length=255, verbose_name='Option C')
    choice_d = models.CharField(max_length=255, verbose_name='Option D')
    
    correct_choice = models.CharField(
        max_length=1,
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        verbose_name='Correct Answer'
    )
    
    class Meta:
        verbose_name = 'Multiple Choice Question'
        verbose_name_plural = 'Multiple Choice Questions'
    
    def get_choices(self):
        """Return dict of all choices"""
        return {
            'A': self.choice_a,
            'B': self.choice_b,
            'C': self.choice_c,
            'D': self.choice_d,
        }
    
    def get_correct_answer(self):
        return self.correct_choice
    
    def validate_answer(self, user_answer):
        """Check if answer matches correct choice (case-insensitive)"""
        return user_answer.upper().strip() == self.correct_choice.upper()
    
    def __str__(self):
        return f"[MCQ] {self.question_text[:30]}"


class TextBoxQuestion(BaseQuestion):
    """
    Free-form text answer question.
    User types in exact answer or fuzzy-matched answer.
    """
    correct_answer = models.CharField(max_length=255)
    accept_fuzzy_match = models.BooleanField(
        default=False,
        help_text='Allow approximate/typo-tolerant matching'
    )
    fuzzy_threshold = models.FloatField(
        default=0.85,
        help_text='Similarity threshold for fuzzy matching (0.0-1.0)'
    )
    
    class Meta:
        verbose_name = 'Text Box Question'
        verbose_name_plural = 'Text Box Questions'
    
    def get_correct_answer(self):
        return self.correct_answer
    
    def validate_answer(self, user_answer):
        """
        Check if answer matches correct answer.
        Supports exact match or fuzzy matching if enabled.
        """
        user_answer = user_answer.strip()
        correct = self.correct_answer.strip()
        
        # Exact match (case-insensitive)
        if user_answer.lower() == correct.lower():
            return True
        
        # Fuzzy match if enabled
        if self.accept_fuzzy_match:
            from difflib import SequenceMatcher
            ratio = SequenceMatcher(None, user_answer.lower(), correct.lower()).ratio()
            return ratio >= self.fuzzy_threshold
        
        return False
    
    def __str__(self):
        return f"[TEXT] {self.question_text[:30]}"


class TrueFalseQuestion(BaseQuestion):
    """
    Simple True/False question.
    """
    correct_answer = models.BooleanField(
        verbose_name='Correct Answer',
        help_text='True or False'
    )
    
    class Meta:
        verbose_name = 'True/False Question'
        verbose_name_plural = 'True/False Questions'
    
    def get_correct_answer(self):
        return 'True' if self.correct_answer else 'False'
    
    def validate_answer(self, user_answer):
        """Check if answer is True or False"""
        user_answer = user_answer.strip().lower()
        correct_str = 'true' if self.correct_answer else 'false'
        return user_answer == correct_str
    
    def __str__(self):
        return f"[T/F] {self.question_text[:30]}"


class QuestionUtility:
    """
    Utility functions for working with polymorphic questions.
    Helps transition from old Question model to new ones.
    """
    
    @staticmethod
    def get_question_by_type(question_id, question_type=None):
        """
        Fetch a question and return the correct subclass instance.
        
        Args:
            question_id: Primary key of question
            question_type: Optional type hint ('mcq', 'text', 'tf')
        
        Returns:
            MCQ, TextBox, or TrueFalse question instance
        """
        if question_type == 'mcq':
            return MultipleChoiceQuestion.objects.get(id=question_id)
        elif question_type == 'text':
            return TextBoxQuestion.objects.get(id=question_id)
        elif question_type == 'tf':
            return TrueFalseQuestion.objects.get(id=question_id)
        else:
            # Try to find which type it is
            for model in [MultipleChoiceQuestion, TextBoxQuestion, TrueFalseQuestion]:
                try:
                    return model.objects.get(id=question_id)
                except model.DoesNotExist:
                    continue
            raise ValueError(f"Question {question_id} not found")
    
    @staticmethod
    def check_answer(question, user_answer):
        """
        Universal answer validation function.
        Works with any question type.
        """
        return question.validate_answer(user_answer)
