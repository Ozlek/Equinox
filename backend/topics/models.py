from django.db import models

class Topic(models.Model):

    TOPIC_CHOICES = [
        ('Arithmetic', 'Arithmetic'),
        ('Number Sense and Place Value', 'Number Sense and Place Value'),
        ('Fractions, Decimals, and Percentages', 'Fractions, Decimals, and Percentages'),
        ('Ratios and Proportional Reasoning', 'Ratios and Proportional Reasoning'),
        ('Algebra and Algebraic Expressions', 'Algebra and Algebraic Expressions'),
        ('Functions and Graphing', 'Functions and Graphing'),
        ('Geometry and Spatial Reasoning', 'Geometry and Spatial Reasoning'),
        ('Exponents, Powers, and Scientific Notation', 'Exponents, Powers, and Scientific Notation'),
        ('Polynomials', 'Polynomials'),
        ('Trigonometry', 'Trigonometry'),
        ('Statistics and Data Analysis', 'Statistics and Data Analysis'),
    ]

    name = models.CharField(
        max_length=100,
        choices=TOPIC_CHOICES
    )

    grade_level_min = models.IntegerField(
        help_text="Minimum grade level (1-10)",
        default=1
    )
    
    grade_level_max = models.IntegerField(
        help_text="Maximum grade level (10)",
        default=10
    )

    description = models.TextField()

    is_visible = models.BooleanField(
        default=True,
        help_text="Whether this topic is visible to learners in the Topic Catalogue"
    )

    def __str__(self):
        return f"{self.name} (Grades {self.grade_level_min}-{self.grade_level_max})"
