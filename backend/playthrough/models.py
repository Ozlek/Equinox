from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from topics.models import Topic

class Question(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    question_text = models.TextField()
    question_solution = models.TextField(
        help_text="Step-by-step solution for the question",
        default="No solution provided"
    )

    # Change these to allow blank values for open-ended text box questions
    choice_a = models.CharField(max_length=255, blank=True, null=True)
    choice_b = models.CharField(max_length=255, blank=True, null=True)
    choice_c = models.CharField(max_length=255, blank=True, null=True)
    choice_d = models.CharField(max_length=255, blank=True, null=True)

    # For MCQ, correct_answer stores 'A', 'B', 'C', or 'D'
    # For Text-Box, correct_answer stores the actual exact answer text string (e.g., "12" or "5/3")
    correct_answer = models.CharField(max_length=255) 

    grade_level = models.IntegerField(
        help_text="Grade level (1-10, where 1-6 is Elementary and 7-10 is Junior High)"
    )
    difficulty = models.FloatField(
        help_text="Difficulty rating: 1.0=Novice, 2.0=Intermediate, 3.0=Advanced"
    )
    
    source = models.CharField(
        max_length=20,
        choices=[
            ('train', 'Training Data'),
            ('test', 'Test Data'),
            ('seed', 'Procedurally Generated')
        ],
        default='seed',
        help_text="Source of the question: train (JSONL import), test (JSONL import), or seed (generated)"
    )
    
    is_word_problem = models.BooleanField(
        default=True,
        help_text="Whether this is a word problem (story-based) or direct math problem"
    )

    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this question has been verified as correct by an instructor or admin"
    )

    template_id = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Links this question to a QuestionTemplate (e.g., 'arith_01', 'alg_05'). Null for imported/non-template questions."
    )

    class Meta:
        indexes = [
            models.Index(fields=['topic', 'difficulty']),
            models.Index(fields=['template_id']),
        ]

    def __str__(self):
        return self.question_text


# ==========================================
# LESSON MODEL
# ==========================================

class Lesson(models.Model):
    """
    Modular lessons/subtopics for each topic and grade level.
    
    Each lesson contains learning objectives, an example problem, and a tip.
    Lessons are ordered within a topic/grade combination.
    """
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='lessons')
    grade_level = models.IntegerField(
        help_text="Grade level (1-10) this lesson is designed for"
    )
    order = models.IntegerField(
        default=0,
        help_text="Display order within the topic/grade"
    )
    title = models.CharField(max_length=200)
    objectives = models.JSONField(
        help_text="List of learning objectives (array of strings)"
    )
    example = models.TextField(
        help_text="Example problem for this lesson"
    )
    tip = models.TextField(
        help_text="Helpful tip for students"
    )

    class Meta:
        ordering = ['grade_level', 'order']
        indexes = [
            models.Index(fields=['topic', 'grade_level', 'order']),
        ]
        unique_together = ('topic', 'grade_level', 'order')

    def __str__(self):
        return f"{self.topic.name} (Grade {self.grade_level}) - {self.title}"


# ==========================================
# QUESTION CHANGE REQUEST MODEL
# ==========================================

class QuestionChangeRequest(models.Model):
    """
    Stores change requests submitted by instructors for admin review.
    
    Acts like a pull request system — instructors propose changes
    (add/edit/delete), and admins approve or reject them before
    they take effect on the Question table.
    """
    CHANGE_TYPES = [
        ('add', 'Add Question'),
        ('edit', 'Edit Question'),
        ('delete', 'Delete Question'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    question = models.ForeignKey(
        Question, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='change_requests'
    )
    change_type = models.CharField(max_length=10, choices=CHANGE_TYPES)
    proposed_data = models.JSONField(
        help_text="The proposed question data as a JSON object"
    )
    submitted_by = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='submitted_change_requests'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending'
    )
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_change_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_change_type_display()} request by {self.submitted_by.username} ({self.status})"


# ==========================================
# LESSON CHANGE REQUEST MODEL
# ==========================================

class LessonChangeRequest(models.Model):
    """
    Stores change requests submitted by instructors for lesson modifications.
    
    Acts like a pull request system — instructors propose changes
    (add/edit/delete), and admins approve or reject them before
    they take effect on the Lesson table.
    """
    CHANGE_TYPES = [
        ('add', 'Add Lesson'),
        ('edit', 'Edit Lesson'),
        ('delete', 'Delete Lesson'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    lesson = models.ForeignKey(
        Lesson, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='change_requests'
    )
    change_type = models.CharField(max_length=10, choices=CHANGE_TYPES)
    proposed_data = models.JSONField(
        help_text="The proposed lesson data as a JSON object"
    )
    submitted_by = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='submitted_lesson_change_requests'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending'
    )
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_lesson_change_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_change_type_display()} request by {self.submitted_by.username} ({self.status})"


# ==========================================
# QUESTION TEMPLATE MODEL
# ==========================================

class QuestionTemplate(models.Model):
    """
    Represents a procedural question template (e.g., arith_01 basic addition).
    Teachers verify these templates once, which cascades to all generated questions.
    """
    DOMAIN_CHOICES = [
        ('Arithmetic', 'Arithmetic'),
        ('Algebra', 'Algebra'),
        ('Geometry', 'Geometry'),
        ('Statistics', 'Statistics'),
        ('Trigonometry', 'Trigonometry'),
    ]
    DIFFICULTY_CHOICES = [
        ('Novice', 'Novice (1.0)'),
        ('Intermediate', 'Intermediate (2.0)'),
        ('Advanced', 'Advanced (3.0)'),
        ('Expert', 'Expert (4.0)'),
    ]

    template_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique identifier matching the generator method (e.g., 'arith_01')"
    )
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    display_name = models.CharField(
        max_length=100,
        help_text="Human-readable name (e.g., 'Basic Addition')"
    )
    template_text = models.TextField(
        help_text="Template with {placeholder} variables (e.g., 'Calculate: {a} + {b}')"
    )
    solution_template = models.TextField(
        help_text="Step-by-step solution with {placeholder} variables"
    )
    base_difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    is_word_problem = models.BooleanField(default=False)
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this template has been verified by an instructor"
    )
    is_implemented = models.BooleanField(
        default=True,
        help_text="Whether a developer has written the generator code. False for instructor-requested templates awaiting implementation."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this template is actively generating questions. Set to False when retired."
    )
    verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='verified_templates'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['domain', 'template_id']

    def __str__(self):
        return f"{self.template_id} - {self.display_name}"


# ==========================================
# TEMPLATE CHANGE REQUEST MODEL
# ==========================================

class TemplateChangeRequest(models.Model):
    """
    Stores change requests submitted by instructors for template modifications.
    
    Acts like a pull request system — instructors propose new templates,
    edits, or deletions, and admins approve/reject them before they take effect.
    """
    CHANGE_TYPES = [
        ('add', 'Add Template'),
        ('edit', 'Edit Template'),
        ('delete', 'Delete Template'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    template = models.ForeignKey(
        QuestionTemplate, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='change_requests'
    )
    change_type = models.CharField(max_length=10, choices=CHANGE_TYPES)
    proposed_data = models.JSONField(
        help_text="The proposed template data as a JSON object. "
                  "For 'add': {domain, display_name, template_text, solution_template, "
                  "base_difficulty, is_word_problem, rationale, sample_numbers}. "
                  "For 'edit': {template_id, reason, ...changed fields}. "
                  "For 'delete': {template_id, reason}."
    )
    submitted_by = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='submitted_template_change_requests'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending'
    )
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_template_change_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_change_type_display()} request by {self.submitted_by.username} ({self.status})"


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


class LearningResource(models.Model):
    """Embeddable learning resources for topics"""
    RESOURCE_TYPES = [
        ('KHAN_ACADEMY', 'Khan Academy'),
        ('PHET', 'PhET Simulation'),
        ('DESMOS', 'Desmos Activity'),
        ('YOUTUBE', 'YouTube Video'),
        ('CK12', 'CK-12 Lesson'),
    ]
    
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='learning_resources')
    grade_level = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    title = models.CharField(max_length=200)
    embed_url = models.URLField()
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['topic', 'grade_level', 'order']),
        ]

    def __str__(self):
        return f"{self.topic.name} - {self.grade_level} - {self.title}"


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


class ShopItem(models.Model):
    """Defines an item available for purchase in the shop with Stars currency."""
    modifier = models.ForeignKey(GamifiedModifier, on_delete=models.CASCADE, related_name='shop_items')
    price = models.IntegerField(help_text="Cost in Stars")
    is_available = models.BooleanField(default=True, help_text="Whether this item is currently available in the shop")

    class Meta:
        verbose_name_plural = "Shop Items"

    def __str__(self):
        return f"{self.modifier.name} - {self.price}⭐"


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
        unique_together = ('user', 'topic')

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