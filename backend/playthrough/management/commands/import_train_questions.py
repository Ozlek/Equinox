import json
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from topics.models import Topic
from playthrough.models import Question


class Command(BaseCommand):
    help = "Import questions from train.jsonl file into the database"

    def __init__(self):
        super().__init__()
        # Topic mapping with grade ranges
        self.topic_config = {
            'Arithmetic': {'min': 1, 'max': 6},
            'Number Sense and Place Value': {'min': 1, 'max': 3},
            'Fractions, Decimals, and Percentages': {'min': 4, 'max': 6},
            'Ratios and Proportional Reasoning': {'min': 5, 'max': 7},
            'Algebra and Algebraic Expressions': {'min': 6, 'max': 8},
            'Functions and Graphing': {'min': 7, 'max': 9},
            'Geometry and Spatial Reasoning': {'min': 3, 'max': 7},
            'Exponents, Powers, and Scientific Notation': {'min': 7, 'max': 9},
            'Polynomials': {'min': 8, 'max': 10},
            'Trigonometry': {'min': 9, 'max': 10},
            'Statistics and Data Analysis': {'min': 5, 'max': 8},
        }

    def extract_answer(self, solution_text):
        """Extract the final answer from solution text (after ####)"""
        match = re.search(r'####\s*([^\n]+)', solution_text)
        if match:
            return match.group(1).strip()
        return None

    def categorize_question(self, question_text, solution_text):
        """
        Categorize question into topic, grade_level, and difficulty based on content analysis.
        Returns (topic_name, grade_level, difficulty)
        """
        q_lower = question_text.lower()
        s_lower = solution_text.lower()
        
        # Count steps in solution (number of <<...>> patterns)
        steps = len(re.findall(r'<<[^>]+>>', solution_text))
        
        # Determine difficulty based on steps
        if steps <= 2:
            difficulty = 1.0  # Novice
        elif steps <= 4:
            difficulty = 2.0  # Intermediate
        else:
            difficulty = 3.0  # Advanced

        # Topic classification based on keywords
        topic_scores = {}
        
        # Arithmetic keywords
        if any(word in q_lower for word in ['add', 'subtract', 'multiply', 'divide', 'total', 'sum', 'difference', 'how many', 'how much']):
            topic_scores['Arithmetic'] = topic_scores.get('Arithmetic', 0) + 2
        
        # Number Sense
        if any(word in q_lower for word in ['place value', 'round', 'digit', 'number']):
            topic_scores['Number Sense and Place Value'] = topic_scores.get('Number Sense and Place Value', 0) + 2
        
        # Fractions/Decimals/Percentages
        if any(word in q_lower for word in ['fraction', 'decimal', 'percent', '%', 'ratio', 'proportion']):
            topic_scores['Fractions, Decimals, and Percentages'] = topic_scores.get('Fractions, Decimals, and Percentages', 0) + 2
        
        # Ratios
        if 'ratio' in q_lower or 'proportional' in q_lower:
            topic_scores['Ratios and Proportional Reasoning'] = topic_scores.get('Ratios and Proportional Reasoning', 0) + 2
        
        # Algebra
        if any(word in q_lower for word in ['variable', 'equation', 'solve for', 'x', 'expression', 'algebra']):
            topic_scores['Algebra and Algebraic Expressions'] = topic_scores.get('Algebra and Algebraic Expressions', 0) + 2
        
        # Functions
        if any(word in q_lower for word in ['function', 'graph', 'coordinate', 'slope', 'intercept']):
            topic_scores['Functions and Graphing'] = topic_scores.get('Functions and Graphing', 0) + 2
        
        # Geometry
        if any(word in q_lower for word in ['area', 'perimeter', 'volume', 'triangle', 'rectangle', 'circle', 'angle', 'shape', 'geometry']):
            topic_scores['Geometry and Spatial Reasoning'] = topic_scores.get('Geometry and Spatial Reasoning', 0) + 2
        
        # Exponents
        if any(word in q_lower for word in ['exponent', 'power', 'scientific notation', 'square root']):
            topic_scores['Exponents, Powers, and Scientific Notation'] = topic_scores.get('Exponents, Powers, and Scientific Notation', 0) + 2
        
        # Polynomials
        if any(word in q_lower for word in ['polynomial', 'quadratic', 'factor']):
            topic_scores['Polynomials'] = topic_scores.get('Polynomials', 0) + 2
        
        # Trigonometry
        if any(word in q_lower for word in ['sin', 'cos', 'tan', 'trigonometry', 'angle']):
            topic_scores['Trigonometry'] = topic_scores.get('Trigonometry', 0) + 2
        
        # Statistics
        if any(word in q_lower for word in ['average', 'mean', 'median', 'probability', 'data', 'statistics', 'percentage']):
            topic_scores['Statistics and Data Analysis'] = topic_scores.get('Statistics and Data Analysis', 0) + 2

        # Default to Arithmetic if no clear topic
        if not topic_scores:
            topic_scores['Arithmetic'] = 1

        # Get the highest scoring topic
        best_topic = max(topic_scores, key=topic_scores.get)
        
        # Determine grade level based on complexity and topic
        grade_level = 5  # Default to grade 5
        
        if best_topic in self.topic_config:
            config = self.topic_config[best_topic]
            # Adjust grade based on difficulty
            if difficulty == 1.0:
                grade_level = config['min']
            elif difficulty == 2.0:
                grade_level = (config['min'] + config['max']) // 2
            else:
                grade_level = min(config['max'], 10)
        
        # Ensure grade is within 1-10 range
        grade_level = max(1, min(10, grade_level))
        
        return best_topic, grade_level, difficulty

    def handle(self, *args, **options):
        self.stdout.write("Starting question import from train.jsonl...")
        
        # Get or create topics
        topics = {}
        for topic_name in self.topic_config.keys():
            topic_obj, created = Topic.objects.get_or_create(
                name=topic_name,
                defaults={
                    'grade_level_min': self.topic_config[topic_name]['min'],
                    'grade_level_max': self.topic_config[topic_name]['max'],
                    'description': f"Questions for {topic_name}"
                }
            )
            topics[topic_name] = topic_obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created topic: {topic_name}"))

        # Read and process JSONL file
        jsonl_path = 'train.jsonl'
        questions_to_create = []
        seen_questions = set()
        skipped_duplicates = 0
        skipped_senior_high = 0
        stats = {
            'total': 0,
            'imported': 0,
            'duplicates': 0,
            'senior_high': 0,
            'by_topic': {},
            'by_grade': {},
            'by_difficulty': {}
        }

        try:
            with open(jsonl_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    stats['total'] += 1
                    
                    try:
                        data = json.loads(line.strip())
                    except json.JSONDecodeError:
                        self.stdout.write(self.style.WARNING(f"Skipping invalid JSON at line {line_num}"))
                        continue

                    question_text = data.get('question', '')
                    solution_text = data.get('answer', '')
                    
                    if not question_text or not solution_text:
                        continue

                    # Check for duplicates
                    if question_text in seen_questions:
                        stats['duplicates'] += 1
                        continue
                    seen_questions.add(question_text)

                    # Extract answer
                    answer = self.extract_answer(solution_text)
                    if not answer:
                        self.stdout.write(self.style.WARNING(f"No answer found for question at line {line_num}"))
                        continue

                    # Categorize question
                    topic_name, grade_level, difficulty = self.categorize_question(question_text, solution_text)
                    
                    # Skip Senior High (grades 11-12)
                    if grade_level >= 11:
                        stats['senior_high'] += 1
                        continue

                    # Get topic object
                    topic_obj = topics.get(topic_name)
                    if not topic_obj:
                        self.stdout.write(self.style.WARNING(f"Topic {topic_name} not found, skipping"))
                        continue

                    # Create Question object
                    question = Question(
                        topic=topic_obj,
                        question_text=question_text,
                        question_solution=solution_text,
                        correct_answer=answer,
                        grade_level=grade_level,
                        difficulty=difficulty,
                        choice_a=None,
                        choice_b=None,
                        choice_c=None,
                        choice_d=None
                    )
                    questions_to_create.append(question)

                    # Update stats
                    stats['imported'] += 1
                    stats['by_topic'][topic_name] = stats['by_topic'].get(topic_name, 0) + 1
                    stats['by_grade'][grade_level] = stats['by_grade'].get(grade_level, 0) + 1
                    stats['by_difficulty'][difficulty] = stats['by_difficulty'].get(difficulty, 0) + 1

                    # Progress update every 500 questions
                    if stats['imported'] % 500 == 0:
                        self.stdout.write(f"Processed {stats['total']} questions, imported {stats['imported']}...")

            # Bulk create all questions in batches
            self.stdout.write(f"\nCreating {len(questions_to_create)} questions in database...")
            batch_size = 500
            for i in range(0, len(questions_to_create), batch_size):
                batch = questions_to_create[i:i + batch_size]
                with transaction.atomic():
                    Question.objects.bulk_create(batch, batch_size=batch_size)
                self.stdout.write(f"Batch {i // batch_size + 1} complete ({min(i + batch_size, len(questions_to_create))}/{len(questions_to_create)})")

            # Print final statistics
            self.stdout.write(self.style.SUCCESS("\n" + "="*60))
            self.stdout.write(self.style.SUCCESS("IMPORT COMPLETE!"))
            self.stdout.write("="*60)
            self.stdout.write(f"Total questions in file: {stats['total']}")
            self.stdout.write(f"Successfully imported: {stats['imported']}")
            self.stdout.write(f"Skipped (duplicates): {stats['duplicates']}")
            self.stdout.write(f"Skipped (Senior High): {stats['senior_high']}")
            self.stdout.write("\nDistribution by Topic:")
            for topic, count in sorted(stats['by_topic'].items()):
                self.stdout.write(f"  {topic}: {count}")
            self.stdout.write("\nDistribution by Grade Level:")
            for grade in sorted(stats['by_grade'].keys()):
                self.stdout.write(f"  Grade {grade}: {stats['by_grade'][grade]}")
            self.stdout.write("\nDistribution by Difficulty:")
            diff_names = {1.0: 'Novice', 2.0: 'Intermediate', 3.0: 'Advanced'}
            for diff in sorted(stats['by_difficulty'].keys()):
                self.stdout.write(f"  {diff_names.get(diff, diff)}: {stats['by_difficulty'][diff]}")
            self.stdout.write("="*60)

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"Error: {jsonl_path} not found!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during import: {str(e)}"))
            raise