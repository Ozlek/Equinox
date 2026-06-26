import random
from django.core.management.base import BaseCommand
from topics.models import Topic
from playthrough.models import Question
from playthrough.question_generator import EquinoxQuestionGenerator

class Command(BaseCommand):
    help = "Seeds the Equinox database with generated procedural questions for DDA testing."

    def handle(self, *args, **options):
        self.stdout.write("Initializing Equinox Question Seeder...")
        
        # 1. Initialize the procedural generator engine
        gen = EquinoxQuestionGenerator()
        
        # 2. Get or create your 5 target core topics in the database
        domains = ["Arithmetic"]
        topic_objects = {}
        
        for name in domains:
            topic_obj, created = Topic.objects.get_or_create(
                name=name,
                defaults={
                    'description': f"Master your skills in {name} with adaptive challenges.",
                    'grade_level': "Junior High"
                }
            )
            topic_objects[name] = topic_obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Topic Node: {name}"))

        # 3. Define a safe generator wrapper for multiple choice formatting
        # Since our generator gives raw text answers, we'll auto-generate 3 distractors
        def build_mock_choices(raw_ans):
            try:
                # If numeric, generate close numeric distractors
                val = int(float(raw_ans))
                distractors = [str(val + random.choice([-2, -1, 1, 2, 5])), 
                               str(val * 2 if val != 0 else 3), 
                               str(val - 3)]
            except ValueError:
                # If string/fraction expression, simple text variations
                distractors = [f"{raw_ans} + c", f"{raw_ans}/2", "0"]

            # Ensure all choices are unique strings
            choices = list(set([str(raw_ans)] + distractors))
            while len(choices) < 4:
                choices.append(f"None of the above {len(choices)}")
            
            random.shuffle(choices)
            
            # Identify correct lookup letter mapping
            correct_letter = "A"
            if choices[0] == str(raw_ans): correct_letter = "A"
            elif choices[1] == str(raw_ans): correct_letter = "B"
            elif choices[2] == str(raw_ans): correct_letter = "C"
            elif choices[3] == str(raw_ans): correct_letter = "D"
            
            return choices[0], choices[1], choices[2], choices[3], correct_letter

        # 4. Loop over each domain and generate 20 questions per template 
        # (Totaling 1,000 items into the database across the 50 templates)
        total_created = 0
        
        for domain, topic_instance in topic_objects.items():
            self.stdout.write(f"Seeding items for {domain}...")
            
            for template_idx in range(10):
                question_count = 100 if domain == "Arithmetic" else 20
                for loop_counter in range(question_count):
                    raw_data = gen.generate(domain, template_index=template_idx)
                    
                    # 50/50 alternating assignment split logic
                    if loop_counter % 2 == 0:
                        # EVEN iterations: Build standard Multiple Choice
                        ch_a, ch_b, ch_c, ch_d, correct_letter = build_mock_choices(raw_data['answer'])
                        
                        Question.objects.create(
                            topic=topic_instance,
                            question_text=raw_data['question'],
                            question_solution=f"""Correct Answer:

                            {raw_data['answer']}

                            Review the lesson "{raw_data.get('lesson', 'Arithmetic')}" if you need more practice.
                            """,
                            choice_a=ch_a,
                            choice_b=ch_b,
                            choice_c=ch_c,
                            choice_d=ch_d,
                            correct_answer=correct_letter, # Stores 'A', 'B', 'C', or 'D'
                            difficulty=raw_data['base_difficulty'],
                            grade_level=raw_data.get("grade_level", 7),
                            source='seed',
                            is_word_problem=raw_data.get("is_word_problem", False),
                        )
                    else:
                        # ODD iterations: Build Clean Text-Box Input structures
                        Question.objects.create(
                            topic=topic_instance,
                            question_text=raw_data['question'],
                            question_solution=f"Step-by-step solution:\n1. Identify the given values\n2. Apply the relevant formula\n3. Calculate the result\n4. Verify the answer\n\nAnswer: {raw_data['answer']}",
                            choice_a=None, # Leave choice values null!
                            choice_b=None,
                            choice_c=None,
                            choice_d=None,
                            correct_answer=raw_data['answer'], # Stores the raw exact text answer value (e.g., "5", "x^3")
                            difficulty=raw_data['base_difficulty'],
                            grade_level=7,  # Junior High = grade 7
                            source='seed',
                            is_word_problem=raw_data.get("is_word_problem", False),
                        )
                    total_created += 1
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_created} questions into the Equinox database!"))