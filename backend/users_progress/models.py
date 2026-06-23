from django.db import models
from django.contrib.auth.models import User
from topics.models import Topic

# Create your models here.

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    gamified_score = models.IntegerField(default=0, db_index=True)
    total_questions = models.IntegerField(default=0)
    difficulty = models.CharField(max_length=20, default='Novice')
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):

        return f"{self.user.username} - {self.topic.name}"
    
    class Meta:
        indexes = [
            models.Index(fields=['topic', 'gamified_score']),
        ]

class UnlockedAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement_id = models.CharField(max_length=100) # e.g., "algebra_master_1"
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement_id') # Prevents duplicate unlocks

    def __str__(self):
        return f"{self.user.username} unlocked {self.achievement_id}"