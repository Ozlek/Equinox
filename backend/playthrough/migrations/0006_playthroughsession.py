# Generated migration for PlaythroughSession model

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('playthrough', '0005_gamifiedmodifier_userinventory'),
        ('topics', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PlaythroughSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('questions_served', models.IntegerField(default=0)),
                ('score', models.IntegerField(default=0)),
                ('gamified_score', models.IntegerField(default=0)),
                ('current_streak', models.IntegerField(default=0)),
                ('current_question_id', models.IntegerField(blank=True, null=True)),
                ('seen_question_ids', models.JSONField(default=list)),
                ('active_modifier_id', models.IntegerField(blank=True, null=True)),
                ('modifier_multiplier', models.FloatField(default=1.0)),
                ('modifier_type', models.CharField(blank=True, max_length=50, null=True)),
                ('modifier_slug', models.CharField(blank=True, max_length=100, null=True)),
                ('question_start_time', models.FloatField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('topic', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='playthrough_sessions',
                    to='topics.topic',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='playthrough_sessions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'indexes': [
                    models.Index(fields=['user', 'topic'], name='playthrough_user_topic_idx'),
                ],
            },
        ),
    ]
