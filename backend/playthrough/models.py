from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
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

    class Meta:
        indexes = [
            models.Index(fields=['topic', 'difficulty']),
        ]

    def __str__(self):
        return self.question_text


# ==========================================
# DDA SUBSYSTEM MODELS
# ==========================================

class DomainRating(models.Model):
    """
    Scalable per-user, per-domain skill rating.
    
    Replaces the hardcoded column approach (algebra_rating, arithmetic_rating, etc.)
    with a proper normalized model. Adding a new math domain requires no migration —
    just insert a new row.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='domain_ratings')
    domain_name = models.CharField(max_length=50)
    rating = models.FloatField(default=1.0)

    class Meta:
        unique_together = ('user', 'domain_name')
        indexes = [
            models.Index(fields=['user', 'domain_name']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.domain_name}: {self.rating:.2f}"


class UserSkillProfile(models.Model):
    """
    Legacy wrapper around DomainRating for backward compatibility.
    
    DEPRECATED: All new code should use DomainRating directly.
    This model is kept temporarily to support the data migration from the old
    hardcoded column approach. The columns (algebra_rating, etc.) will be removed
    after the migration is verified.
    """
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

    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['domain', 'timestamp']),
        ]

    def __str__(self):
        status = "Correct" if self.is_correct else "Incorrect"
        return f"{self.user.username} - QID {self.question.id} ({status})"


class ResponseLogArchive(models.Model):
    """
    Aggregated daily statistics for archived ResponseLog entries.
    
    Created by the cleanup_old_responses management command to preserve
    historical analytics data while keeping the ResponseLog table lean.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='response_archives')
    domain = models.CharField(max_length=50)
    date = models.DateField()
    total_attempts = models.IntegerField(default=0)
    correct_attempts = models.IntegerField(default=0)
    avg_difficulty = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'domain', 'date')
        indexes = [
            models.Index(fields=['user', 'date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.domain} - {self.date}: {self.correct_attempts}/{self.total_attempts}"


# ==========================================
# GAMIFICATION & MODIFIER SYSTEM MODELS
# ==========================================

class GamifiedModifier(models.Model):
    """Defines the available game items/multipliers a user can equip."""
    MODIFIER_TYPES = [
        ('SCORE_BOOST', 'Score Multiplier'),
        ('STREAK_SHIELD', 'Streak Protection'),
    ]
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, help_text="Unique identifier used by frontend and session cache (e.g., 'double-xp')")
    modifier_type = models.CharField(max_length=20, choices=MODIFIER_TYPES)
    multiplier_value = models.FloatField(default=1.0, help_text="Multiplier applied to points (e.g., 1.5, 2.0). Ignore if type is a shield.")
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.get_modifier_type_display()})"

class UserInventory(models.Model):
    """Tracks item quantities owned by individual students."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory')
    modifier = models.ForeignKey(GamifiedModifier, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'modifier')
        verbose_name_plural = "User Inventories"
        indexes = [
            models.Index(fields=['user', 'quantity']),
        ]

    def __str__(self):
        return f"{self.user.username} owns {self.quantity}x {self.modifier.name}"


# ==========================================
# PLAYTHROUGH SESSION MODEL
# ==========================================

class PlaythroughSession(models.Model):
    """
    Database-backed playthrough session replacing fragile request.session state.

    Stores all in-progress quiz state for a single user's active session on a
    given topic. Using a DB model eliminates race conditions and session expiry
    issues that arise from cookie-based session storage.

    A session is considered expired if it has not been updated in more than one
    hour (see ``is_expired``). Only one active session per user/topic pair is
    expected at a time; callers should call ``end_session`` before starting a
    new one.
    """

    SESSION_EXPIRY_SECONDS = 3600  # 1 hour

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playthrough_sessions')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='playthrough_sessions')

    # Progress counters
    questions_served = models.IntegerField(default=0)
    score = models.IntegerField(default=0)
    gamified_score = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)

    # Current question tracking
    current_question_id = models.IntegerField(null=True, blank=True)
    seen_question_ids = models.JSONField(default=list)

    # Modifier state
    active_modifier_id = models.IntegerField(null=True, blank=True)
    modifier_multiplier = models.FloatField(default=1.0)
    modifier_type = models.CharField(max_length=50, null=True, blank=True)
    modifier_slug = models.CharField(max_length=100, null=True, blank=True)

    # Timing
    question_start_time = models.FloatField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'topic']),
            models.Index(fields=['updated_at']),
        ]

    def is_expired(self):
        """
        Return True if the session has been idle for longer than SESSION_EXPIRY_SECONDS.

        Uses ``updated_at`` (auto-updated on every save) as the activity timestamp
        so any state mutation resets the expiry clock.
        """
        age = (timezone.now() - self.updated_at).total_seconds()
        return age > self.SESSION_EXPIRY_SECONDS

    def end_session(self):
        """
        Permanently delete this session record from the database.

        Call this after a session completes normally, after a one-life game-over,
        or when the user explicitly quits. The caller is responsible for persisting
        any final ``UserProgress`` record before calling this method.
        """
        self.delete()

    def __str__(self):
        return f"PlaythroughSession({self.user.username}, {self.topic.name}, q={self.questions_served})"