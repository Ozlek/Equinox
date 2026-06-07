from django.db import models

# Create your models here.
class Topic(models.Model):

    TOPIC_CHOICES = [
        ('Arithmetic', 'Arithmetic'),
        ('Algebra', 'Algebra'),
        ('Geometry', 'Geometry'),
        ('Trigonometry', 'Trigonometry'),
        ('Statistics', 'Statistics'),
    ]

    GRADE_CHOICES = [
        ('Elementary', 'Elementary'),
        ('Junior High', 'Junior High'),
        ('Senior High', 'Senior High'),
    ]

    name = models.CharField(
        max_length=100,
        choices=TOPIC_CHOICES
    )

    grade_level = models.CharField(
        max_length=50,
        choices=GRADE_CHOICES
    )

    description = models.TextField()

    def __str__(self):
        return f"{self.name} ({self.grade_level})"