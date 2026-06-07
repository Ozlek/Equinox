from django.db import models
from django.contrib.auth.models import User
from topics.models import Topic

class Question(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    question_text = models.TextField()

    # Change these to allow blank values for open-ended text box questions
    choice_a = models.CharField(max_length=255, blank=True, null=True)
    choice_b = models.CharField(max_length=255, blank=True, null=True)
    choice_c = models.CharField(max_length=255, blank=True, null=True)
    choice_d = models.CharField(max_length=255, blank=True, null=True)

    # For MCQ, correct_answer stores 'A', 'B', 'C', or 'D'
    # For Text-Box, correct_answer stores the actual exact answer text string (e.g., "12" or "5/3")
    correct_answer = models.CharField(max_length=255) 

    grade_level = models.CharField(
        max_length=50,
        choices=[('Elementary', 'Elementary'), ('Junior High', 'Junior High'), ('Senior High', 'Senior High')],
        default='Elementary'
    )
    difficulty = models.CharField(
        max_length=20,
        choices=[('Novice', 'Novice'), ('Intermediate', 'Intermediate'), ('Advanced', 'Advanced'), ('Expert', 'Expert')]
    )

    def __str__(self):
        return self.question_text

# ==========================================
# DDA SUBSYSTEM MODELS
# ==========================================

class UserSkillProfile(models.Model):
    """Tracks the continuous DDA performance tier of a user across domains."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # 1.0 = Novice, 2.0 = Intermediate, 3.0 = Advanced, 4.0 = Expert
    algebra_rating = models.FloatField(default=1.0)
    arithmetic_rating = models.FloatField(default=1.0)
    geometry_rating = models.FloatField(default=1.0)
    statistics_rating = models.FloatField(default=1.0)
    trigonometry_rating = models.FloatField(default=1.0)

    def get_rating(self, domain_name):
        """Helper to dynamically fetch rating based on the string name of the topic domain."""
        domain_map = {
            "Algebra": self.algebra_rating,
            "Arithmetic": self.arithmetic_rating,
            "Geometry": self.geometry_rating,
            "Statistics": self.statistics_rating,
            "Trigonometry": self.trigonometry_rating,
        }
        # Fallback to general arithmetic if a specific domain is mismatched
        return domain_map.get(domain_name, 1.0)

    def update_rating(self, domain_name, new_rating):
        """Bounds the rating between 1.0 and 4.5 and saves it."""
        bounded_rating = max(1.0, min(new_rating, 4.5))
        attr_name = f"{domain_name.lower()}_rating"
        if hasattr(self, attr_name):
            setattr(self, attr_name, bounded_rating)
            self.save()

    def __str__(self):
        return f"Skill Profile - {self.user.username}"


class ResponseLog(models.Model):
    """Logs individual performance for the Probabilistic Engine and analytics."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Link to your concrete Question model
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # Redundant domain storage for faster query optimization in the DDA Engine
    domain = models.CharField(max_length=50) 
    question_difficulty_value = models.FloatField() # Numeric equivalent of the difficulty tier served
    is_correct = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "Correct" if self.is_correct else "Incorrect"
        return f"{self.user.username} - QID {self.question.id} ({status})"