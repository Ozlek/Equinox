"""
Data migration to update grade ranges for post-testing topics.
"""
from django.db import migrations

def update_topic_grade_ranges(apps, schema_editor):
    Topic = apps.get_model('topics', 'Topic')
    
    # Grade ranges for the 5 post-testing topics
    topic_ranges = {
        'Arithmetic': (1, 6),
        'Fractions, Decimals, and Percentages': (4, 8),
        'Ratios and Proportional Reasoning': (6, 8),
        'Algebra and Algebraic Expressions': (7, 10),
        'Geometry and Spatial Reasoning': (3, 10),
    }
    
    # Also update the descriptions to be more user-friendly
    topic_descriptions = {
        'Arithmetic': 'Master the fundamentals of addition, subtraction, multiplication, and division.',
        'Fractions, Decimals, and Percentages': 'Understand rational numbers, decimal operations, and percentage applications.',
        'Ratios and Proportional Reasoning': 'Explore proportional relationships, unit rates, and scaling concepts.',
        'Algebra and Algebraic Expressions': 'Dive into variables, equations, expressions, and algebraic thinking.',
        'Geometry and Spatial Reasoning': 'Study shapes, angles, area, volume, and spatial relationships.',
    }
    
    for name, (min_grade, max_grade) in topic_ranges.items():
        # Only update these 5 topics
        Topic.objects.filter(name=name).update(
            grade_level_min=min_grade,
            grade_level_max=max_grade,
            description=topic_descriptions.get(name, ''),
        )

def reverse_migration(apps, schema_editor):
    # Don't try to reverse - the old values are gone
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('topics', '0003_remove_topic_grade_level_topic_grade_level_max_and_more'),
    ]

    operations = [
        migrations.RunPython(update_topic_grade_ranges, reverse_migration),
    ]