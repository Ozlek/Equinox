from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    grade_level = models.IntegerField(null=True, blank=True)
    has_completed_onboarding = models.BooleanField(default=False)
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='student',
    )

    def __str__(self):
        return f"{self.user.username}'s profile ({self.get_user_type_display()})"


class UserStars(models.Model):
    """Tracks the user's Stars balance — a premium currency earned from achievements and playthroughs."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stars')
    balance = models.IntegerField(default=0, help_text="Current spendable star balance")
    total_earned = models.IntegerField(default=0, help_text="Lifetime stars earned (for tracking)")

    def __str__(self):
        return f"{self.user.username}: {self.balance} ⭐ (earned: {self.total_earned})"

    def add_stars(self, amount):
        """Add stars to balance and lifetime total."""
        self.balance += amount
        self.total_earned += amount
        self.save()

    def spend_stars(self, amount):
        """Spend stars if sufficient balance exists. Returns True on success."""
        if self.balance >= amount:
            self.balance -= amount
            self.save()
            return True
        return False


# Auto-create a profile whenever a new User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        UserStars.objects.create(user=instance)