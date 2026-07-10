"""
Django management command to seed lessons for topics.

Usage:
    python manage.py seed_lessons
"""
from django.core.management.base import BaseCommand
from playthrough.models import Lesson
from topics.models import Topic


class Command(BaseCommand):
    help = "Seed lessons for all topics with grade-level appropriate content"

    def handle(self, *args, **options):
        self.stdout.write("Seeding lessons...")

        # Define lessons data for each topic
        # Format: {topic_name: {grade_level: [lessons]}}
        lessons_data = {
            'Arithmetic': {
                1: [
                    {
                        'order': 1,
                        'title': 'Counting Numbers',
                        'objectives': [
                            'Count numbers from 1 to 20',
                            'Count objects correctly',
                            'Recognize increasing number order'
                        ],
                        'example': '🍎🍎🍎🍎 = 4',
                        'tip': 'Point to each object while counting.'
                    },
                    {
                        'order': 2,
                        'title': 'Number Recognition',
                        'objectives': [
                            'Recognize numbers from 0 to 20',
                            'Identify missing numbers',
                            'Read numbers correctly'
                        ],
                        'example': '15',
                        'tip': 'Practice reading numbers aloud.'
                    },
                    {
                        'order': 3,
                        'title': 'Addition within 10',
                        'objectives': [
                            'Add two numbers within 10',
                            'Represent addition using objects',
                            'Solve simple addition problems'
                        ],
                        'example': '3 + 2 = 5',
                        'tip': 'Start counting from the bigger number.'
                    },
                    {
                        'order': 4,
                        'title': 'Addition within 20',
                        'objectives': [
                            'Add numbers within 20',
                            'Use counting strategies',
                            'Solve simple equations'
                        ],
                        'example': '13 + 5 = 18',
                        'tip': 'Break the second number into smaller parts.'
                    },
                    {
                        'order': 5,
                        'title': 'Subtraction within 10',
                        'objectives': [
                            'Subtract numbers within 10',
                            'Understand taking away',
                            'Solve subtraction problems'
                        ],
                        'example': '9 − 4 = 5',
                        'tip': 'Count backwards carefully.'
                    },
                    {
                        'order': 6,
                        'title': 'Word Problems',
                        'objectives': [
                            'Read mathematical situations',
                            'Identify important numbers',
                            'Choose the correct operation'
                        ],
                        'example': 'Anna has 5 apples and buys 3 more.',
                        'tip': 'Underline important numbers before solving.'
                    },
                ],
                2: [
                    {
                        'order': 1,
                        'title': 'Addition Facts to 20',
                        'objectives': [
                            'Master addition facts up to 20',
                            'Use mental math strategies',
                            'Apply addition to word problems'
                        ],
                        'example': '8 + 7 = 15',
                        'tip': 'Practice with flashcards daily.'
                    },
                    {
                        'order': 2,
                        'title': 'Subtraction Facts to 20',
                        'objectives': [
                            'Master subtraction facts up to 20',
                            'Use related addition facts',
                            'Solve subtraction word problems'
                        ],
                        'example': '16 − 9 = 7',
                        'tip': 'Think: What plus 9 equals 16?'
                    },
                    {
                        'order': 3,
                        'title': 'Introduction to Multiplication',
                        'objectives': [
                            'Understand multiplication as repeated addition',
                            'Multiply numbers 1-10',
                            'Solve simple multiplication problems'
                        ],
                        'example': '4 × 3 = 12 (4 groups of 3)',
                        'tip': 'Use arrays or groups to visualize multiplication.'
                    },
                    {
                        'order': 4,
                        'title': 'Introduction to Division',
                        'objectives': [
                            'Understand division as sharing',
                            'Divide numbers 1-10',
                            'Relate division to multiplication'
                        ],
                        'example': '12 ÷ 4 = 3',
                        'tip': 'Division is the opposite of multiplication.'
                    },
                ],
                3: [
                    {
                        'order': 1,
                        'title': 'Multiplication Facts',
                        'objectives': [
                            'Master multiplication tables 1-10',
                            'Use multiplication properties',
                            'Apply to real-world problems'
                        ],
                        'example': '7 × 8 = 56',
                        'tip': 'Practice skip counting to build fluency.'
                    },
                    {
                        'order': 2,
                        'title': 'Division Facts',
                        'objectives': [
                            'Master division facts 1-100',
                            'Understand remainders',
                            'Solve division word problems'
                        ],
                        'example': '45 ÷ 6 = 7 remainder 3',
                        'tip': 'Check your work by multiplying.'
                    },
                    {
                        'order': 3,
                        'title': 'Properties of Operations',
                        'objectives': [
                            'Commutative, associative, and distributive properties',
                            'Apply properties to simplify calculations',
                            'Use properties in problem solving'
                        ],
                        'example': '3(x + 2) = 3x + 6',
                        'tip': 'Properties help you calculate faster.'
                    },
                ],
            },
            'Fractions, Decimals, and Percentages': {
                1: [
                    {
                        'order': 1,
                        'title': 'Understanding Fractions',
                        'objectives': [
                            'Recognize fractions as parts of a whole',
                            'Identify numerator and denominator',
                            'Compare simple fractions'
                        ],
                        'example': '3/4 means 3 parts out of 4 equal parts',
                        'tip': 'Use pizza slices to visualize fractions.'
                    },
                    {
                        'order': 2,
                        'title': 'Equivalent Fractions',
                        'objectives': [
                            'Find equivalent fractions',
                            'Simplify fractions to lowest terms',
                            'Compare fractions with different denominators'
                        ],
                        'example': '1/2 = 2/4 = 3/6',
                        'tip': 'Multiply top and bottom by the same number.'
                    },
                ],
                2: [
                    {
                        'order': 1,
                        'title': 'Adding and Subtracting Fractions',
                        'objectives': [
                            'Add fractions with like denominators',
                            'Subtract fractions with like denominators',
                            'Find common denominators'
                        ],
                        'example': '1/4 + 2/4 = 3/4',
                        'tip': 'Only add the numerators when denominators match.'
                    },
                    {
                        'order': 2,
                        'title': 'Decimals Introduction',
                        'objectives': [
                            'Understand decimal place value',
                            'Read and write decimals',
                            'Compare decimal values'
                        ],
                        'example': '0.5 is the same as 1/2',
                        'tip': 'The decimal point separates whole numbers from parts.'
                    },
                ],
            },
            'Algebra and Algebraic Expressions': {
                1: [
                    {
                        'order': 1,
                        'title': 'Introduction to Variables',
                        'objectives': [
                            'Understand what variables represent',
                            'Write expressions with variables',
                            'Evaluate simple expressions'
                        ],
                        'example': 'If x = 5, then x + 3 = 8',
                        'tip': 'A variable is just a letter that stands for a number.'
                    },
                    {
                        'order': 2,
                        'title': 'Simple Equations',
                        'objectives': [
                            'Solve one-step equations',
                            'Check solutions by substitution',
                            'Write equations from word problems'
                        ],
                        'example': 'x + 4 = 10, so x = 6',
                        'tip': 'Do the same thing to both sides.'
                    },
                ],
                2: [
                    {
                        'order': 1,
                        'title': 'Linear Equations',
                        'objectives': [
                            'Solve two-step equations',
                            'Combine like terms',
                            'Apply equations to problems'
                        ],
                        'example': '2x + 3 = 11, so 2x = 8, x = 4',
                        'tip': 'Undo operations in reverse order.'
                    },
                    {
                        'order': 2,
                        'title': 'Algebraic Expressions',
                        'objectives': [
                            'Simplify expressions',
                            'Use distributive property',
                            'Factor common terms'
                        ],
                        'example': '3(x + 2) = 3x + 6',
                        'tip': 'Multiply each term inside the parentheses.'
                    },
                ],
            },
            'Geometry and Spatial Reasoning': {
                1: [
                    {
                        'order': 1,
                        'title': 'Basic Shapes',
                        'objectives': [
                            'Identify 2D shapes',
                            'Count sides and vertices',
                            'Recognize shape properties'
                        ],
                        'example': 'Triangle has 3 sides and 3 vertices',
                        'tip': 'Vertices is the fancy word for corners.'
                    },
                    {
                        'order': 2,
                        'title': 'Area and Perimeter',
                        'objectives': [
                            'Calculate area of rectangles',
                            'Calculate perimeter of shapes',
                            'Apply to real-world problems'
                        ],
                        'example': 'Area = length × width',
                        'tip': 'Perimeter is the distance around the shape.'
                    },
                ],
                2: [
                    {
                        'order': 1,
                        'title': 'Angles and Triangles',
                        'objectives': [
                            'Measure and classify angles',
                            'Identify triangle types',
                            'Calculate missing angles'
                        ],
                        'example': 'Angles in a triangle sum to 180°',
                        'tip': 'Angles are measured in degrees.'
                    },
                    {
                        'order': 2,
                        'title': 'Circles and Circumference',
                        'objectives': [
                            'Identify circle parts',
                            'Calculate circumference',
                            'Understand pi (π)'
                        ],
                        'example': 'Circumference = π × diameter',
                        'tip': 'Pi is approximately 3.14.'
                    },
                ],
            },
            'Ratios and Proportional Reasoning': {
                1: [
                    {
                        'order': 1,
                        'title': 'Understanding Ratios',
                        'objectives': [
                            'Write ratios in different forms',
                            'Compare quantities',
                            'Simplify ratios'
                        ],
                        'example': 'The ratio of boys to girls is 3:2',
                        'tip': 'Read ratios like "3 to 2".'
                    },
                    {
                        'order': 2,
                        'title': 'Unit Rates',
                        'objectives': [
                            'Find unit rates',
                            'Compare unit rates',
                            'Solve rate problems'
                        ],
                        'example': 'If 3 apples cost $1.50, each apple costs $0.50',
                        'tip': 'Divide to find the cost of one unit.'
                    },
                ],
            },
        }

        created_count = 0
        skipped_count = 0

        for topic_name, grades in lessons_data.items():
            try:
                topic = Topic.objects.get(name=topic_name)
                
                for grade_level, lessons in grades.items():
                    for lesson_data in lessons:
                        lesson, created = Lesson.objects.get_or_create(
                            topic=topic,
                            grade_level=grade_level,
                            order=lesson_data['order'],
                            defaults={
                                'title': lesson_data['title'],
                                'objectives': lesson_data['objectives'],
                                'example': lesson_data['example'],
                                'tip': lesson_data['tip'],
                            }
                        )
                        
                        if created:
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(f"  ✓ Created: {lesson}")
                            )
                        else:
                            skipped_count += 1
                            self.stdout.write(
                                self.style.WARNING(f"  - Skipped (exists): {lesson}")
                            )
                            
            except Topic.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Topic not found: {topic_name}")
                )
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Seeding complete! Created: {created_count}, Skipped: {skipped_count}"
            )
        )