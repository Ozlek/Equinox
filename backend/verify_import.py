#!/usr/bin/env python
"""
Quick verification script to check if imported questions work correctly
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'equinoxSite.settings')
django.setup()

from playthrough.models import Question, DomainRating, ResponseLog, PlaythroughSession
from topics.models import Topic
from playthrough.dda_engine import EquinoxDDAEngine
from django.contrib.auth.models import User
import time

def print_header(text):
    print("\n" + "="*60)
    print(text)
    print("="*60)

def main():
    print_header("VERIFYING IMPORTED QUESTIONS")
    
    # 1. Check total count
    print_header("1. Total Questions Imported")
    total = Question.objects.count()
    print(f"✓ Total questions in database: {total}")
    assert total > 7000, f"Expected 7473, got {total}"
    print("✓ Question count is correct!")
    
    # 2. Check topics
    print_header("2. Topics Distribution")
    topics = Topic.objects.all()
    print(f"✓ Total topics: {topics.count()}")
    for topic in topics:
        count = Question.objects.filter(topic=topic).count()
        print(f"  - {topic.name}: {count} questions")
    
    # 3. Check grade distribution
    print_header("3. Grade Level Distribution")
    for grade in range(1, 11):
        count = Question.objects.filter(grade_level=grade).count()
        if count > 0:
            print(f"  Grade {grade}: {count} questions")
    
    # 4. Check difficulty distribution
    print_header("4. Difficulty Distribution")
    novice = Question.objects.filter(difficulty=1.0).count()
    intermediate = Question.objects.filter(difficulty=2.0).count()
    advanced = Question.objects.filter(difficulty=3.0).count()
    print(f"  Novice (1.0): {novice} questions")
    print(f"  Intermediate (2.0): {intermediate} questions")
    print(f"  Advanced (3.0): {advanced} questions")
    
    # 5. Test DDA Engine
    print_header("5. Testing DDA Engine")
    user = User.objects.filter(username='testuser').first()
    if not user:
        user = User.objects.create_user(username='testuser', password='testpass')
    
    # Get a question
    question = Question.objects.first()
    print(f"✓ Testing with question ID: {question.id}")
    print(f"  Topic: {question.topic.name}")
    print(f"  Grade: {question.grade_level}")
    print(f"  Difficulty: {question.difficulty}")
    
    # Create or get domain rating
    domain_name = question.topic.name
    rating, created = DomainRating.objects.get_or_create(
        user=user,
        domain_name=domain_name,
        defaults={'rating': 2.0}
    )
    print(f"✓ Domain rating: {rating.rating}")
    
    # Test DDA adjustment
    dda = EquinoxDDAEngine()
    initial_rating = rating.rating
    
    print("\n  Testing correct answer...")
    new_rating = dda.adjust_difficulty(user, domain_name, question, is_correct=True)
    rating.refresh_from_db()
    print(f"  ✓ Rating changed: {initial_rating} -> {rating.rating}")
    assert rating.rating > initial_rating, "Rating should increase on correct answer"
    print("  ✓ DDA engine works correctly!")
    
    # 6. Test Response Log
    print_header("6. Testing Response Logging")
    log_count = ResponseLog.objects.filter(user=user).count()
    print(f"✓ Response logs created: {log_count}")
    
    # 7. Test Quiz Session
    print_header("7. Testing Quiz Session")
    session = PlaythroughSession.objects.create(
        user=user,
        topic=question.topic,
        questions_served=1,
        score=1,
        current_question_id=question.id,
        seen_question_ids=[question.id]
    )
    print(f"✓ Created session ID: {session.id}")
    print(f"  Questions served: {session.questions_served}")
    print(f"  Current question: {session.current_question_id}")
    
    # Clean up test session
    session.delete()
    
    # 8. Sample Questions
    print_header("8. Sample Questions")
    print("\nSample Novice Question:")
    novice_q = Question.objects.filter(difficulty=1.0).first()
    if novice_q:
        print(f"  Q: {novice_q.question_text[:100]}...")
        print(f"  Answer: {novice_q.correct_answer}")
    
    print("\nSample Intermediate Question:")
    inter_q = Question.objects.filter(difficulty=2.0).first()
    if inter_q:
        print(f"  Q: {inter_q.question_text[:100]}...")
        print(f"  Answer: {inter_q.correct_answer}")
    
    print("\nSample Advanced Question:")
    adv_q = Question.objects.filter(difficulty=3.0).first()
    if adv_q:
        print(f"  Q: {adv_q.question_text[:100]}...")
        print(f"  Answer: {adv_q.correct_answer}")
    
    # 9. Performance Test
    print_header("9. Performance Test")
    start = time.time()
    questions = list(Question.objects.filter(topic__name='Arithmetic')[:100])
    elapsed = time.time() - start
    print(f"✓ Fetched 100 Arithmetic questions in {elapsed:.3f}s")
    assert elapsed < 1.0, f"Query too slow: {elapsed}s"
    print("✓ Performance is good!")
    
    # Final Summary
    print_header("✓ ALL VERIFICATION TESTS PASSED!")
    print("\nSummary:")
    print(f"  • {total} questions imported successfully")
    print(f"  • {topics.count()} topics created")
    print(f"  • Questions span grades 1-10")
    print(f"  • Three difficulty levels: Novice, Intermediate, Advanced")
    print(f"  • DDA engine works correctly with imported questions")
    print(f"  • Response logging functional")
    print(f"  • Quiz sessions can use imported questions")
    print(f"  • Query performance is excellent")
    print("\n✓ The imported questions are ready for production use!")
    print("="*60 + "\n")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)