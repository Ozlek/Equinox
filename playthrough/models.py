from django.db import models
from topics.models import Topic

# Create your models here.
# Multiple Choice Questions Model:
class Question(models.Model):

    # Connects questions to related topics
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE
    )

    question_text = models.TextField()

    choice_a = models.CharField(max_length=255)

    choice_b = models.CharField(max_length=255)

    choice_c = models.CharField(max_length=255)

    choice_d = models.CharField(max_length=255)

    correct_answer = models.CharField(max_length=1)

    # Difficulty choices can be renamed in the future.
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('Novice', 'Novice'),
            ('Intermediate', 'Intermediate'),
            ('Advanced', 'Advanced'),
            ('Expert', 'Expert'),
        ]
    )

    def __str__(self):

        return self.question_text