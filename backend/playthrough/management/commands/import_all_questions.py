"""
Unified command to import all questions from all sources:
1. Training data (train.jsonl) - marked as 'train' source, is_word_problem=True
2. Test data (test.jsonl) - marked as 'test' source, is_word_problem=True  
3. Procedurally generated (seed) - marked as 'seed' source, is_word_problem=False

This command should be run after migrations are applied.
"""
import json
import random
from django.core.management.base import BaseCommand
from topics.models import Topic
from playthrough.models import Question
from playthrough.question_generator import EquinoxQuestionGenerator


class Command(BaseCommand):
    help = "Import all questions from all sources (train.jsonl, test.jsonl, and procedural generation)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-train',
            action='store_true',
            help='Skip importing train.jsonl'
        )
        parser.add_argument(
            '--skip-test',
            action='store_true',
            help='Skip importing test.jsonl'
        )
        parser.add_argument(
            '--skip-seed',
            action='store_true',
            help='Skip importing procedurally generated questions'
        )
        parser.add_argument(
            '--seed-count',
            type=int,
            default=200,
            help='Number of seed questions to generate per domain (default: 200, total: 1000)'
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("EQUINOX UNIFIED QUESTION IMPORT")
        self.stdout.write("=" * 60)
        
        total_imported = 0
        
        # 1. Import training data
        if not options['skip_train']:
            self.stdout.write("\n[1/3] Importing training data from train.jsonl...")
            count = self.import_jsonl('train.jsonl', 'train', is_word_problem=True)
            self.stdout.write(self.style.SUCCESS(f"✓ Imported {count} training questions"))
            total_imported += count
        else:
            self.stdout.write(self.style.WARNING("\n[1/3] Skipping train.jsonl"))
        
        # 2. Import test data
        if not options['skip_test']:
            self.stdout.write("\n[2/3] Importing test data from test.jsonl...")
            count = self.import_jsonl('test.jsonl', 'test', is_word_problem=True)
            self.stdout.write(self.style.SUCCESS(f"✓ Imported {count} test questions"))
            total_imported += count
        else:
            self.stdout.write(self.style.WARNING("\n[2/3] Skipping test.jsonl"))
        
        # 3. Generate seed questions
        if not options['skip_seed']:
            self.stdout.write("\n[3/3] Generating procedurally generated questions...")
            count = self.generate_seed_questions(options['seed_count'])
            self.stdout.write(self.style.SUCCESS(f"✓ Generated {count} seed questions"))
            total_imported += count
        else:
            self.stdout.write(self.style.WARNING("\n[3/3] Skipping seed question generation"))
        
        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS(f"TOTAL QUESTIONS IMPORTED: {total_imported}"))
        self.stdout.write("=" * 60)
        
        # Show breakdown by source
        self.show_source_breakdown()

    def import_jsonl(self, filepath, source, is_word_problem):
        """
        Import questions from a JSONL file.
        
        Expected JSONL format (one JSON object per line):
        {
            "topic": "Algebra",
            "question": "Solve for x: x + 5 = 10",
            "answer": "5",
            "difficulty": "Novice",  # or numeric 1.0, 2.0, 3.0
            "grade_level": "Junior High",  # or numeric 7-10
            "choices": ["A) 3", "B) 5", "C) 7", "D) 9"],  # optional, for MCQ
            "correct_letter": "B"  # optional, for MCQ
        }
        """
        count = 0
        errors = 0
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        data = json.loads(line)
                        
                        # Get or create topic
                        topic_name = data.get('topic', 'General')
                        topic, _ = Topic.objects.get_or_create(
                            name=topic_name,
                            defaults={
                                'description': f"Auto-imported topic: {topic_name}",
                                'grade_level_min': 7,
                                'grade_level_max': 7
                            }
                        )
                        
                        # Parse difficulty (must be float)
                        difficulty = data.get('difficulty', 1.0)
                        if isinstance(difficulty, str):
                            difficulty_map = {'Novice': 1.0, 'Intermediate': 2.0, 'Advanced': 3.0, 'Expert': 4.0}
                            difficulty = difficulty_map.get(difficulty, 1.0)
                        else:
                            # Ensure it's a float
                            difficulty = float(difficulty)
                        
                        # Parse grade level (must be integer)
                        grade_level = data.get('grade_level', 7)
                        if isinstance(grade_level, str):
                            grade_level_map = {
                                'Elementary': 4, 'Grade 4': 4, 'Grade 5': 5, 'Grade 6': 6,
                                'Junior High': 7, 'Grade 7': 7, 'Grade 8': 8, 
                                'Grade 9': 9, 'Grade 10': 10
                            }
                            grade_level = grade_level_map.get(grade_level, 7)
                        else:
                            # Ensure it's an integer
                            grade_level = int(grade_level)
                        
                        # Determine if MCQ or text-box
                        choices = data.get('choices', [])
                        correct_letter = data.get('correct_letter', '')
                        answer_value = data.get('answer', '')
                        
                        if choices and len(choices) >= 4 and correct_letter:
                            # MCQ format - correct_answer stores the letter (A, B, C, D)
                            choice_a = choices[0] if len(choices) > 0 else None
                            choice_b = choices[1] if len(choices) > 1 else None
                            choice_c = choices[2] if len(choices) > 2 else None
                            choice_d = choices[3] if len(choices) > 3 else None
                            correct_answer = correct_letter
                        else:
                            # Text-box format - correct_answer stores the actual answer
                            choice_a = None
                            choice_b = None
                            choice_c = None
                            choice_d = None
                            
                            # Parse GSM8K format: "solution text\n#### answer"
                            # The answer after #### is the actual answer value
                            # Everything before #### is the step-by-step solution
                            raw_answer = answer_value
                            question_solution = ""
                            
                            if '####' in raw_answer:
                                parts = raw_answer.split('####')
                                question_solution = parts[0].strip()
                                correct_answer = parts[1].strip() if len(parts) > 1 else raw_answer
                            else:
                                correct_answer = raw_answer
                        
                        # Create question
                        # For text-box format, the solution text (before #### in GSM8K)
                        # is stored in question_solution, and the final answer (after ####)
                        # is stored in correct_answer.
                        Question.objects.create(
                            topic=topic,
                            question_text=data.get('question', ''),
                            question_solution=question_solution,
                            choice_a=choice_a,
                            choice_b=choice_b,
                            choice_c=choice_c,
                            choice_d=choice_d,
                            correct_answer=correct_answer,
                            difficulty=difficulty,
                            grade_level=grade_level,
                            source=source,
                            is_word_problem=is_word_problem
                        )
                        count += 1
                        
                    except Exception as e:
                        errors += 1
                        self.stdout.write(
                            self.style.WARNING(f"  Warning on line {line_num}: {str(e)}")
                        )
                        continue
                        
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"  File not found: {filepath}"))
            return 0
        
        if errors > 0:
            self.stdout.write(
                self.style.WARNING(f"  Completed with {errors} errors/warnings")
            )
        
        return count

    def generate_seed_questions(self, count_per_domain):
        """
        Generate procedurally generated questions using EquinoxQuestionGenerator.
        """
        gen = EquinoxQuestionGenerator()
        domains = ["Arithmetic", "Algebra", "Geometry", "Statistics", "Trigonometry"]
        
        # Get or create topics
        topic_objects = {}
        for name in domains:
            topic_obj, _ = Topic.objects.get_or_create(
                name=name,
                defaults={
                    'description': f"Master your skills in {name} with adaptive challenges.",
                    'grade_level_min': 7,
                    'grade_level_max': 7
                }
            )
            topic_objects[name] = topic_obj
        
        total_created = 0
        
        for domain, topic_instance in topic_objects.items():
            self.stdout.write(f"  Generating {count_per_domain} questions for {domain}...")
            
            # Calculate questions per template
            templates = gen.registry[domain]
            num_templates = len(templates)
            # count_per_domain is total per domain, divide by number of templates
            questions_per_template = max(1, count_per_domain // num_templates)
            
            created_for_domain = 0
            
            for template_idx in range(num_templates):
                for _ in range(questions_per_template):
                    try:
                        raw_data = gen.generate(domain, template_index=template_idx)
                        
                        # 50/50 split between MCQ and text-box
                        if random.random() < 0.5:
                            # MCQ format
                            correct_ans = raw_data['answer']
                            try:
                                val = int(float(correct_ans))
                                distractors = [
                                    str(val + random.choice([-2, -1, 1, 2, 5])),
                                    str(val * 2 if val != 0 else 3),
                                    str(val - 3)
                                ]
                            except ValueError:
                                distractors = [f"{correct_ans} + c", f"{correct_ans}/2", "0"]
                            
                            choices = list(set([str(correct_ans)] + distractors))
                            while len(choices) < 4:
                                choices.append(f"None of the above {len(choices)}")
                            random.shuffle(choices)
                            
                            correct_letter = "A"
                            if choices[0] == str(correct_ans): correct_letter = "A"
                            elif choices[1] == str(correct_ans): correct_letter = "B"
                            elif choices[2] == str(correct_ans): correct_letter = "C"
                            elif choices[3] == str(correct_ans): correct_letter = "D"
                            
                            # Parse difficulty (must be float)
                            difficulty = raw_data.get('base_difficulty', 'Novice')
                            if isinstance(difficulty, str):
                                difficulty_map = {'Novice': 1.0, 'Intermediate': 2.0, 'Advanced': 3.0, 'Expert': 4.0}
                                difficulty = difficulty_map.get(difficulty, 1.0)
                            else:
                                difficulty = float(difficulty)
                            
                            Question.objects.create(
                                topic=topic_instance,
                                question_text=raw_data['question'],
                                question_solution=f"Step-by-step solution:\n1. Identify the given values\n2. Apply the relevant formula\n3. Calculate the result\n4. Verify the answer\n\nAnswer: {correct_ans}",
                                choice_a=choices[0],
                                choice_b=choices[1],
                                choice_c=choices[2],
                                choice_d=choices[3],
                                correct_answer=correct_letter,
                                difficulty=difficulty,
                                grade_level=7,  # Junior High = grade 7
                                source='seed',
                                is_word_problem=False
                            )
                        else:
                            # Text-box format
                            # Parse difficulty (must be float)
                            difficulty = raw_data.get('base_difficulty', 'Novice')
                            if isinstance(difficulty, str):
                                difficulty_map = {'Novice': 1.0, 'Intermediate': 2.0, 'Advanced': 3.0, 'Expert': 4.0}
                                difficulty = difficulty_map.get(difficulty, 1.0)
                            else:
                                difficulty = float(difficulty)
                            
                            Question.objects.create(
                                topic=topic_instance,
                                question_text=raw_data['question'],
                                question_solution=f"Step-by-step solution:\n1. Identify the given values\n2. Apply the relevant formula\n3. Calculate the result\n4. Verify the answer\n\nAnswer: {raw_data['answer']}",
                                choice_a=None,
                                choice_b=None,
                                choice_c=None,
                                choice_d=None,
                                correct_answer=raw_data['answer'],
                                difficulty=difficulty,
                                grade_level=7,  # Junior High = grade 7
                                source='seed',
                                is_word_problem=False
                            )
                        
                        created_for_domain += 1
                        
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f"  Warning generating question: {str(e)}")
                        )
                        continue
            
            self.stdout.write(f"    ✓ Created {created_for_domain} questions for {domain}")
            total_created += created_for_domain
        
        return total_created

    def show_source_breakdown(self):
        """Display a breakdown of questions by source."""
        self.stdout.write("\nQuestion count by source:")
        self.stdout.write("-" * 40)
        
        for source_code, source_name in [('train', 'Training Data'), ('test', 'Test Data'), ('seed', 'Procedurally Generated')]:
            count = Question.objects.filter(source=source_code).count()
            self.stdout.write(f"  {source_name:25s}: {count:6d}")
        
        self.stdout.write("-" * 40)
        total = Question.objects.count()
        self.stdout.write(f"  {'TOTAL':25s}: {total:6d}")
        
        # Show breakdown by word problem status
        self.stdout.write("\nQuestion count by type:")
        self.stdout.write("-" * 40)
        word_problems = Question.objects.filter(is_word_problem=True).count()
        direct_problems = Question.objects.filter(is_word_problem=False).count()
        self.stdout.write(f"  {'Word Problems':25s}: {word_problems:6d}")
        self.stdout.write(f"  {'Direct Math Problems':25s}: {direct_problems:6d}")
        self.stdout.write("-" * 40)