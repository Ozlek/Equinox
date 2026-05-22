from django.db import models
from django.contrib.auth.models import User
from topics.models import Topic

# Create your models here.

class UserProgress(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE
    )

    score = models.IntegerField(default=0)

    total_questions = models.IntegerField(default=0)

    difficulty = models.CharField(
        max_length=20,
        default='Novice'
    )

    completed_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return f"{self.user.username} - {self.topic.name}"