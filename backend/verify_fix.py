#!/usr/bin/env python
"""
Quick verification that the grade_level fix works.
Tests creating a question with integer grade_level.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'equinoxSite.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from topics.models import Topic
from playthrough.models import Question

print("=" * 60)
print("VERIFYING GRADE_LEVEL FIX")
print("=" * 60)

# Get or create a test topic
topic, _ = Topic.objects.get_or_create(
    name="Test",
    defaults={
        'description': 'Test topic',
        'grade_level_min': 7,
        'grade_level_max': 7
    }
)

# Test 1: Create a seed question with integer grade_level
print("\nTest 1: Creating seed question with grade_level=7...")
try:
    q1 = Question.objects.create(
        topic=topic,
        question_text="Test question: What is 2 + 2?",
        question_solution="Answer: 4",
        correct_answer="4",
        difficulty=1.0,
        grade_level=7,  # Integer, not string
        source='seed',
        is_word_problem=False
    )
    print(f"✓ SUCCESS: Created question with grade_level={q1.grade_level}")
except Exception as e:
    print(f"✗ FAILED: {e}")
    sys.exit(1)

# Test 2: Create a train question with integer grade_level
print("\nTest 2: Creating train question with grade_level=8...")
try:
    q2 = Question.objects.create(
        topic=topic,
        question_text="Test word problem: John has 5 apples...",
        question_solution="Answer: 8",
        correct_answer="8",
        difficulty=2.0,
        grade_level=8,  # Integer, not string
        source='train',
        is_word_problem=True
    )
    print(f"✓ SUCCESS: Created question with grade_level={q2.grade_level}")
except Exception as e:
    print(f"✗ FAILED: {e}")
    sys.exit(1)

# Cleanup test questions
print("\nCleaning up test questions...")
q1.delete()
q2.delete()

print("\n" + "=" * 60)
print("ALL TESTS PASSED! ✓")
print("=" * 60)
print("\nYou can now run the full import:")
print("  python run_import.py")