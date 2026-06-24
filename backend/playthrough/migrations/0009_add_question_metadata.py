# Generated migration for adding source and is_word_problem fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('playthrough', '0008_migrate_skill_profiles_to_domain_ratings'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='source',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('train', 'Training Data'),
                    ('test', 'Test Data'),
                    ('seed', 'Procedurally Generated')
                ],
                default='seed',
                help_text="Source of the question: train (JSONL import), test (JSONL import), or seed (generated)"
            ),
        ),
        migrations.AddField(
            model_name='question',
            name='is_word_problem',
            field=models.BooleanField(
                default=True,
                help_text="Whether this is a word problem (story-based) or direct math problem"
            ),
        ),
    ]