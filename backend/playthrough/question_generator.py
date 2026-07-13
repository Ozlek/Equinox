import random
import math
from playthrough.models import QuestionTemplate


class EquinoxQuestionGenerator:
    """
    Procedural question generator for Equinox Thesis Project.
    Generates 50 distinct templates across 5 math domains with DDA metadata.
    """

    def __init__(self):
        # Maps domains to their available template functions
        self.registry = {
            "Arithmetic": [
                self.arith_01_basic_addition, self.arith_02_subtraction_negative,
                self.arith_03_multiplication_mesh, self.arith_04_integer_division,
                self.arith_05_order_of_ops, self.arith_06_fraction_addition,
                self.arith_07_decimal_multiplication, self.arith_08_percentage_of_value,
                self.arith_09_lcm, self.arith_10_gcd
            ],
            "Algebra": [
                self.alg_01_linear_one_step, self.alg_02_linear_two_step,
                self.alg_03_simplify_expression, self.alg_04_quadratic_factored,
                self.alg_05_exponent_rules, self.alg_06_system_linear,
                self.alg_07_absolute_value, self.alg_08_linear_inequality,
                self.alg_09_log_to_exponential, self.alg_10_arithmetic_sequence
            ],
            "Geometry": [
                self.geom_01_area_rectangle, self.geom_02_perimeter_rectangle,
                self.geom_03_triangle_area, self.geom_04_pythagorean_theorem,
                self.geom_05_circle_area, self.geom_06_circle_circumference,
                self.geom_07_volume_cube, self.geom_08_supplementary_angles,
                self.geom_09_interior_angles_polygon, self.geom_10_cylinder_volume
            ],
            "Statistics": [
                self.stat_01_mean, self.stat_02_median, self.stat_03_mode,
                self.stat_04_range, self.stat_05_basic_probability,
                self.stat_06_complementary_probability, self.stat_07_independent_probability,
                self.stat_08_weighted_mean, self.stat_09_factorial, self.stat_10_permutations
            ],
            "Trigonometry": [
                self.trig_01_soh_sin, self.trig_02_cah_cos, self.trig_03_toa_tan,
                self.trig_04_pythagorean_identity, self.trig_05_deg_to_rad,
                self.trig_06_rad_to_deg, self.trig_07_unit_circle_sin,
                self.trig_08_unit_circle_cos, self.trig_09_coterminal_angle,
                self.trig_10_amplitude_periodic
            ]
        }

    # ==========================================
    # TEMPLATE METADATA
    # ==========================================
    # Each entry: (template_id, display_name, template_text, solution_template, base_difficulty, is_word_problem)
    TEMPLATE_METADATA = {
        "arith_01": ("Basic Addition", "Calculate: {a} + {b}", "Step 1: Identify the two numbers: {a} and {b}.\nStep 2: Add them together: {a} + {b} = {result}.", "Novice", False),
        "arith_02": ("Subtraction (Negative Result)", "Calculate: {a} - {b}", "Step 1: Identify the two numbers: {a} and {b}.\nStep 2: Subtract: {a} - {b} = {result}.", "Novice", False),
        "arith_03": ("Multiplication", "Calculate: {a} × {b}", "Step 1: Identify the two numbers: {a} and {b}.\nStep 2: Multiply them: {a} × {b} = {result}.", "Novice", False),
        "arith_04": ("Integer Division", "Calculate: {a} ÷ {b}", "Step 1: Identify the dividend ({a}) and divisor ({b}).\nStep 2: Divide: {a} ÷ {b} = {result}.", "Novice", False),
        "arith_05": ("Order of Operations (PEMDAS)", "Simplify using PEMDAS: {a} + {b} × {c}", "Step 1: Apply PEMDAS — multiplication comes before addition.\nStep 2: Multiply first: {b} × {c} = {b_times_c}.\nStep 3: Then add: {a} + {b_times_c} = {result}.", "Intermediate", False),
        "arith_06": ("Fraction Addition (Like Denominators)", "Add the fractions: {num1}/{den} + {num2}/{den}", "Step 1: The denominators are the same ({den}), so add the numerators.\nStep 2: {num1} + {num2} = {num_sum}.\nStep 3: Keep the denominator: {num_sum}/{den}.", "Intermediate", False),
        "arith_07": ("Decimal Multiplication", "Calculate: {a} × {b}", "Step 1: Identify the numbers: {a} and {b}.\nStep 2: Multiply: {a} × {b} = {result}.", "Intermediate", False),
        "arith_08": ("Percentage of a Value", "What is {pct}% of {val}?", "Step 1: Convert {pct}% to a decimal: {pct}/100 = {pct_dec}.\nStep 2: Multiply: {pct_dec} × {val} = {result}.", "Intermediate", False),
        "arith_09": ("Least Common Multiple", "Find the Least Common Multiple (LCM) of {a} and {b}", "Step 1: List the multiples of each number.\nStep 2: The smallest common multiple is {result}.", "Advanced", False),
        "arith_10": ("Greatest Common Divisor", "Find the Greatest Common Divisor (GCD) of {a} and {b}", "Step 1: List the factors of each number.\nStep 2: The largest common factor is {result}.", "Advanced", False),

        "alg_01": ("One-Step Linear Equations", "Solve for x: x + {a} = {total}", "Step 1: Subtract {a} from both sides: x = {total} - {a}.\nStep 2: Simplify: x = {result}.", "Novice", False),
        "alg_02": ("Two-Step Linear Equations", "Solve for x: {a}x + {b} = {total}", "Step 1: Subtract {b} from both sides: {a}x = {total} - {b} = {right}.\nStep 2: Divide both sides by {a}: x = {right} ÷ {a} = {result}.", "Intermediate", False),
        "alg_03": ("Simplify Expressions", "Simplify: {a}x + {b} + {a}x", "Step 1: Combine like terms (x terms): {a}x + {a}x = {coeff}x.\nStep 2: The constant {b} stays: {coeff}x + {b}.", "Intermediate", False),
        "alg_04": ("Quadratic Equations (Factored Form)", "Find the positive roots/solutions of x² {sign} {abs_b}x + {c} = 0. Separate with a comma if distinct.", "Step 1: Factor the quadratic: (x - {r1})(x - {r2}) = 0.\nStep 2: Set each factor to zero: x - {r1} = 0 or x - {r2} = 0.\nStep 3: Solve: x = {r1} or x = {r2}.", "Advanced", False),
        "alg_05": ("Exponent Rules (Product)", "Simplify: (x^{p1}) * (x^{p2})", "Step 1: When multiplying same bases, add the exponents.\nStep 2: x^{p1} × x^{p2} = x^{p1+p2} = x^{result}.", "Intermediate", False),
        "alg_06": ("Systems of Linear Equations", "Given the system: x + y = {s} and x - y = {d}. What is the value of x?", "Step 1: Add the two equations to eliminate y: (x+y) + (x-y) = {s} + {d}.\nStep 2: 2x = {s_plus_d}.\nStep 3: Divide by 2: x = {result}.", "Advanced", False),
        "alg_07": ("Absolute Value Equations", "Solve for positive x: |x - {b}| = {x_pos}", "Step 1: Since |x - {b}| = {x_pos}, we have x - {b} = {x_pos} or x - {b} = -{x_pos}.\nStep 2: For the positive case: x = {x_pos} + {b} = {result}.", "Intermediate", False),
        "alg_08": ("Linear Inequalities", "Solve the inequality: {a}x > {b}", "Step 1: Divide both sides by {a} (positive, so inequality sign stays the same).\nStep 2: x > {b} ÷ {a}.\nStep 3: x > {result}.", "Intermediate", False),
        "alg_09": ("Logarithms to Exponential", "Evaluate: log_{base}({val})", "Step 1: Rewrite as an exponential: log_{base}({val}) = ? means base^? = {val}.\nStep 2: Since {base}^{exp} = {val}, the answer is {exp}.", "Expert", False),
        "alg_10": ("Arithmetic Sequences", "Find the 4th term of the arithmetic sequence: {start}, {term2}, {term3}, ...", "Step 1: Identify the common difference: {term2} - {start} = {diff}.\nStep 2: The 4th term = 1st term + 3 × difference = {start} + 3×{diff} = {result}.", "Advanced", False),

        "geom_01": ("Area of a Rectangle", "Find the area of a rectangle with width = {w} and height = {h}.", "Step 1: Use the formula for area of a rectangle: Area = width × height.\nStep 2: Area = {w} × {h} = {result}.", "Novice", False),
        "geom_02": ("Perimeter of a Rectangle", "Find the perimeter of a rectangle with width = {w} and height = {h}.", "Step 1: Use the formula for perimeter: P = 2(width + height).\nStep 2: P = 2({w} + {h}) = 2 × {w_plus_h} = {result}.", "Novice", False),
        "geom_03": ("Area of a Triangle", "Find the area of a triangle with base = {b} and height = {h}.", "Step 1: Use the formula: Area = ½ × base × height.\nStep 2: Area = ½ × {b} × {h} = {result}.", "Intermediate", False),
        "geom_04": ("Pythagorean Theorem", "In a right-angled triangle, the legs are {a} and {b}. Find the hypotenuse.", "Step 1: Use the Pythagorean theorem: c² = a² + b².\nStep 2: c² = {a}² + {b}² = {a_sq} + {b_sq} = {c_sq}.\nStep 3: c = √{c_sq} = {result}.", "Intermediate", False),
        "geom_05": ("Area of a Circle", "Find the area of a circle with radius = {r} in terms of pi (e.g., 25pi).", "Step 1: Use the formula: Area = πr².\nStep 2: Area = π × {r}² = {r_sq}π.", "Intermediate", False),
        "geom_06": ("Circumference of a Circle", "Find the circumference of a circle with radius = {r} in terms of pi (e.g., 10pi).", "Step 1: Use the formula: C = 2πr.\nStep 2: C = 2π × {r} = {result}π.", "Intermediate", False),
        "geom_07": ("Volume of a Cube", "Find the volume of a cube whose side length is {s}.", "Step 1: Use the formula: Volume = s³.\nStep 2: Volume = {s}³ = {result}.", "Intermediate", False),
        "geom_08": ("Supplementary Angles", "Angle A and Angle B are supplementary. If Angle A = {angle}°, find Angle B.", "Step 1: Supplementary angles sum to 180°.\nStep 2: Angle B = 180° - {angle}° = {result}°.", "Novice", False),
        "geom_09": ("Interior Angles of a Polygon", "What is the sum of the interior angles of a regular {name}?", "Step 1: Use the formula: Sum = (n - 2) × 180°.\nStep 2: Sum = ({sides} - 2) × 180° = {result}°.", "Advanced", False),
        "geom_10": ("Volume of a Cylinder", "Find the volume of a cylinder with radius = {r} and height = {h} in terms of pi.", "Step 1: Use the formula: Volume = πr²h.\nStep 2: Volume = π × {r}² × {h} = {result}π.", "Advanced", False),

        "stat_01": ("Mean (Average)", "Find the mean of these numbers: {num_str}", "Step 1: Add all the numbers: {sum_str} = {total}.\nStep 2: Count the numbers: {count}.\nStep 3: Divide sum by count: {total} ÷ {count} = {result}.", "Intermediate", False),
        "stat_02": ("Median", "Find the median of this dataset: {num_str}", "Step 1: The numbers are already sorted.\nStep 2: With {count} numbers, the median is the middle value: {result}.", "Intermediate", False),
        "stat_03": ("Mode", "Find the mode of this dataset: {num_str}", "Step 1: Count how many times each number appears.\nStep 2: The number that appears most frequently is {result}.", "Novice", False),
        "stat_04": ("Range", "Find the range of this dataset: {num_str}", "Step 1: Identify the largest number ({max_val}) and the smallest ({min_val}).\nStep 2: Range = {max_val} - {min_val} = {result}.", "Novice", False),
        "stat_05": ("Basic Probability", "A bag contains {red} red marbles and {blue} blue marbles. What is the probability of picking a red marble?", "Step 1: Total marbles = {red} + {blue} = {total}.\nStep 2: P(red) = red marbles / total marbles = {red}/{total}.", "Novice", False),
        "stat_06": ("Complementary Probability", "The probability of it raining today is {pct}%. What is the probability that it will NOT rain?", "Step 1: P(not rain) = 100% - P(rain).\nStep 2: P(not rain) = 100% - {pct}% = {result}%.", "Novice", False),
        "stat_07": ("Independent Probability", "If you flip a fair coin and roll a standard 6-sided die, what is the probability of getting Heads and rolling a {die_target}?", "Step 1: P(Heads) = 1/2. P(rolling {die_target}) = 1/6.\nStep 2: For independent events: P(A and B) = P(A) × P(B) = 1/2 × 1/6 = 1/12.", "Advanced", False),
        "stat_08": ("Weighted Mean", "A student scores 80 on a test weighted at 40% and 90 on a final exam weighted at 60%. Find the final score.", "Step 1: Multiply each score by its weight: 80 × 0.40 = 32, 90 × 0.60 = 54.\nStep 2: Add the weighted scores: 32 + 54 = 86.", "Advanced", False),
        "stat_09": ("Factorial", "Evaluate the factorial expression: {n}!", "Step 1: {n}! = {n} × {n_minus_1} × ... × 2 × 1.\nStep 2: = {result}.", "Intermediate", False),
        "stat_10": ("Permutations", "How many ways can a President and Vice President be elected from a group of 5 people?", "Step 1: For President: 5 choices. For Vice President: 4 remaining choices.\nStep 2: Total = 5 × 4 = 20.", "Advanced", False),

        "trig_01": ("Sine (SOH)", "In a right triangle, if the opposite side is 3 and the hypotenuse is 5, what is sin(θ)?", "Step 1: SOH: sin(θ) = Opposite / Hypotenuse.\nStep 2: sin(θ) = 3 / 5.", "Intermediate", False),
        "trig_02": ("Cosine (CAH)", "In a right triangle, if the adjacent side is 4 and the hypotenuse is 5, what is cos(θ)?", "Step 1: CAH: cos(θ) = Adjacent / Hypotenuse.\nStep 2: cos(θ) = 4 / 5.", "Intermediate", False),
        "trig_03": ("Tangent (TOA)", "In a right triangle, if the opposite side is 3 and the adjacent side is 4, what is tan(θ)?", "Step 1: TOA: tan(θ) = Opposite / Adjacent.\nStep 2: tan(θ) = 3 / 4.", "Intermediate", False),
        "trig_04": ("Pythagorean Identity", "Simplify the expression: sin²(θ) + cos²(θ)", "Step 1: Recall the Pythagorean identity: sin²(θ) + cos²(θ) = 1.\nStep 2: Therefore, the answer is 1.", "Intermediate", False),
        "trig_05": ("Degrees to Radians", "Convert {deg} degrees to radians.", "Step 1: Multiply by π/180: {deg} × π/180 = {deg}/180 π.\nStep 2: Simplify: {result}.", "Intermediate", False),
        "trig_06": ("Radians to Degrees", "Convert pi/4 radians to degrees.", "Step 1: Multiply by 180/π: (π/4) × (180/π) = 180/4.\nStep 2: = 45°.", "Intermediate", False),
        "trig_07": ("Unit Circle — Sine", "What is the exact value of sin(90°)?", "Step 1: On the unit circle, at 90°, the coordinates are (0, 1).\nStep 2: sin(θ) = y-coordinate = 1.", "Advanced", False),
        "trig_08": ("Unit Circle — Cosine", "What is the exact value of cos(180°)?", "Step 1: On the unit circle, at 180°, the coordinates are (-1, 0).\nStep 2: cos(θ) = x-coordinate = -1.", "Advanced", False),
        "trig_09": ("Coterminal Angles", "Find a positive coterminal angle for {angle}° between 0° and 360°.", "Step 1: Subtract 360°: {angle}° - 360° = {result}°.\nStep 2: {result}° is between 0° and 360°.", "Advanced", False),
        "trig_10": ("Amplitude of Periodic Functions", "What is the amplitude of the function y = {amp}sin(x)?", "Step 1: For y = A sin(x), the amplitude is |A|.\nStep 2: Amplitude = {amp}.", "Novice", False),
    }

    def generate(self, domain, template_index=None):
        """Master route to generate a question."""
        if domain not in self.registry:
            raise ValueError(f"Domain {domain} not found in Equinox Registry.")
        
        templates = self.registry[domain]
        if template_index is list or template_index is None:
            func = random.choice(templates)
        else:
            func = templates[template_index % len(templates)]
            
        return func()

    def register_templates(self):
        """
        Sync all 50 templates into the QuestionTemplate database table.
        Creates new entries for templates that don't exist yet; updates existing ones.
        Returns the count of created/updated templates.
        """
        created_count = 0
        updated_count = 0

        for domain, funcs in self.registry.items():
            for func in funcs:
                # Call the function once to get its id and metadata
                sample = func()
                template_id = sample["id"]
                base_difficulty = sample["base_difficulty"]
                is_word_problem = sample["is_word_problem"]

                meta = self.TEMPLATE_METADATA.get(template_id)
                if not meta:
                    continue

                display_name, template_text, solution_template, _, _ = meta

                obj, created = QuestionTemplate.objects.update_or_create(
                    template_id=template_id,
                    defaults={
                        "domain": domain,
                        "display_name": display_name,
                        "template_text": template_text,
                        "solution_template": solution_template,
                        "base_difficulty": base_difficulty,
                        "is_word_problem": is_word_problem,
                        "is_implemented": True,
                        "is_active": True,
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return created_count, updated_count

    # ==========================================
    # ARITHMETIC TEMPLATES (1-10)
    # ==========================================
    def arith_01_basic_addition(self):
        a, b = random.randint(10, 99), random.randint(10, 99)
        return {"question": f"Calculate: {a} + {b}", "answer": str(a + b), "solution": f"Step 1: Identify the two numbers: {a} and {b}.\nStep 2: Add them together: {a} + {b} = {a + b}.", "domain": "Arithmetic", "id": "arith_01", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def arith_02_subtraction_negative(self):
        a, b = random.randint(50, 150), random.randint(60, 200)
        return {"question": f"Calculate: {a} - {b}", "answer": str(a - b), "solution": f"Step 1: Identify the two numbers: {a} and {b}.\nStep 2: Subtract: {a} - {b} = {a - b}.", "domain": "Arithmetic", "id": "arith_02", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def arith_03_multiplication_mesh(self):
        a, b = random.randint(6, 15), random.randint(6, 12)
        return {"question": f"Calculate: {a} × {b}", "answer": str(a * b), "solution": f"Step 1: Identify the two numbers: {a} and {b}.\nStep 2: Multiply them: {a} × {b} = {a * b}.", "domain": "Arithmetic", "id": "arith_03", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def arith_04_integer_division(self):
        b = random.randint(4, 12)
        ans = random.randint(5, 15)
        a = b * ans
        return {"question": f"Calculate: {a} ÷ {b}", "answer": str(ans), "solution": f"Step 1: Identify the dividend ({a}) and divisor ({b}).\nStep 2: Divide: {a} ÷ {b} = {ans}.", "domain": "Arithmetic", "id": "arith_04", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def arith_05_order_of_ops(self):
        a, b, c = random.randint(2, 6), random.randint(3, 8), random.randint(1, 10)
        b_times_c = b * c
        result = a + b_times_c
        return {"question": f"Simplify using PEMDAS: {a} + {b} × {c}", "answer": str(result), "solution": f"Step 1: Apply PEMDAS — multiplication comes before addition.\nStep 2: Multiply first: {b} × {c} = {b_times_c}.\nStep 3: Then add: {a} + {b_times_c} = {result}.", "domain": "Arithmetic", "id": "arith_05", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def arith_06_fraction_addition(self):
        # Same denominator for clean input
        den = random.choice([3, 4, 5, 7])
        num1 = random.randint(1, den - 1)
        num2 = random.randint(1, den - 1)
        num_sum = num1 + num2
        return {"question": f"Add the fractions: {num1}/{den} + {num2}/{den}", "answer": f"{num_sum}/{den}", "solution": f"Step 1: The denominators are the same ({den}), so add the numerators.\nStep 2: {num1} + {num2} = {num_sum}.\nStep 3: Keep the denominator: {num_sum}/{den}.", "domain": "Arithmetic", "id": "arith_06", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def arith_07_decimal_multiplication(self):
        a = round(random.uniform(1.1, 4.9), 1)
        b = 2
        return {"question": f"Calculate: {a} × {b}", "answer": str(round(a * b, 1)), "solution": f"Step 1: Identify the numbers: {a} and {b}.\nStep 2: Multiply: {a} × {b} = {round(a * b, 1)}.", "domain": "Arithmetic", "id": "arith_07", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def arith_08_percentage_of_value(self):
        pct = random.choice([10, 20, 25, 50])
        val = random.randint(1, 10) * 40
        ans = int((pct / 100) * val)
        pct_dec = pct / 100
        return {"question": f"What is {pct}% of {val}?", "answer": str(ans), "solution": f"Step 1: Convert {pct}% to a decimal: {pct}/100 = {pct_dec}.\nStep 2: Multiply: {pct_dec} × {val} = {ans}.", "domain": "Arithmetic", "id": "arith_08", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def arith_09_lcm(self):
        a, b = random.choice([(4,6), (3,5), (6,8), (4,10)])
        ans = math.lcm(a, b)
        return {"question": f"Find the Least Common Multiple (LCM) of {a} and {b}", "answer": str(ans), "solution": f"Step 1: List the multiples of each number.\nStep 2: The smallest common multiple is {ans}.", "domain": "Arithmetic", "id": "arith_09", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def arith_10_gcd(self):
        a, b = random.choice([(12,18), (24,36), (15,45), (18,24)])
        ans = math.gcd(a, b)
        return {"question": f"Find the Greatest Common Divisor (GCD) of {a} and {b}", "answer": str(ans), "solution": f"Step 1: List the factors of each number.\nStep 2: The largest common factor is {ans}.", "domain": "Arithmetic", "id": "arith_10", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}


    # ==========================================
    # ALGEBRA TEMPLATES (11-20)
    # ==========================================
    def alg_01_linear_one_step(self):
        x = random.randint(2, 15)
        a = random.randint(5, 30)
        total = x + a
        return {"question": f"Solve for x: x + {a} = {total}", "answer": str(x), "solution": f"Step 1: Subtract {a} from both sides: x = {total} - {a}.\nStep 2: Simplify: x = {x}.", "domain": "Algebra", "id": "alg_01", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def alg_02_linear_two_step(self):
        x = random.randint(1, 10)
        a = random.randint(2, 9)
        b = random.randint(1, 20)
        total = a * x + b
        right = total - b
        return {"question": f"Solve for x: {a}x + {b} = {total}", "answer": str(x), "solution": f"Step 1: Subtract {b} from both sides: {a}x = {total} - {b} = {right}.\nStep 2: Divide both sides by {a}: x = {right} ÷ {a} = {x}.", "domain": "Algebra", "id": "alg_02", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def alg_03_simplify_expression(self):
        a, b = random.randint(2, 6), random.randint(2, 6)
        coeff = 2 * a
        return {"question": f"Simplify: {a}x + {b} + {a}x", "answer": f"{coeff}x+{b}", "solution": f"Step 1: Combine like terms (x terms): {a}x + {a}x = {coeff}x.\nStep 2: The constant {b} stays: {coeff}x + {b}.", "domain": "Algebra", "id": "alg_03", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def alg_04_quadratic_factored(self):
        # (x - r1)(x - r2) = x^2 - (r1+r2)x + r1*r2
        r1, r2 = random.randint(1, 5), random.randint(1, 5)
        b = -(r1 + r2)
        c = r1 * r2
        sign = "-" if b < 0 else "+"
        abs_b = abs(b)
        return {"question": f"Find the positive roots/solutions of x² {sign} {abs_b}x + {c} = 0. Separate with a comma if distinct.", "answer": f"{r1},{r2}" if r1 != r2 else str(r1), "solution": f"Step 1: Factor the quadratic: (x - {r1})(x - {r2}) = 0.\nStep 2: Set each factor to zero: x - {r1} = 0 or x - {r2} = 0.\nStep 3: Solve: x = {r1} or x = {r2}.", "domain": "Algebra", "id": "alg_04", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def alg_05_exponent_rules(self):
        p1, p2 = random.randint(2, 5), random.randint(2, 5)
        result = p1 + p2
        return {"question": f"Simplify: (x^{p1}) * (x^{p2})", "answer": f"x^{result}", "solution": f"Step 1: When multiplying same bases, add the exponents.\nStep 2: x^{p1} × x^{p2} = x^{p1+p2} = x^{result}.", "domain": "Algebra", "id": "alg_05", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def alg_06_system_linear(self):
        # x + y = s, x - y = d
        x, y = random.randint(5, 10), random.randint(1, 4)
        s, d = x + y, x - y
        s_plus_d = s + d
        return {"question": f"Given the system: x + y = {s} and x - y = {d}. What is the value of x?", "answer": str(x), "solution": f"Step 1: Add the two equations to eliminate y: (x+y) + (x-y) = {s} + {d}.\nStep 2: 2x = {s_plus_d}.\nStep 3: Divide by 2: x = {x}.", "domain": "Algebra", "id": "alg_06", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def alg_07_absolute_value(self):
        x_pos = random.randint(2, 8)
        b = random.randint(1, 5)
        ans = x_pos + b
        return {"question": f"Solve for positive x: |x - {b}| = {x_pos}", "answer": str(ans), "solution": f"Step 1: Since |x - {b}| = {x_pos}, we have x - {b} = {x_pos} or x - {b} = -{x_pos}.\nStep 2: For the positive case: x = {x_pos} + {b} = {ans}.", "domain": "Algebra", "id": "alg_07", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def alg_08_linear_inequality(self):
        # ax > b -> x > ans
        a = random.choice([2, 3, 5])
        ans = random.randint(2, 6)
        b = a * ans
        return {"question": f"Solve the inequality: {a}x > {b}", "answer": f"x>{ans}", "solution": f"Step 1: Divide both sides by {a} (positive, so inequality sign stays the same).\nStep 2: x > {b} ÷ {a}.\nStep 3: x > {ans}.", "domain": "Algebra", "id": "alg_08", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def alg_09_log_to_exponential(self):
        base = random.choice([2, 3, 10])
        exp = random.randint(2, 4)
        val = base ** exp
        return {"question": f"Evaluate: log_{base}({val})", "answer": str(exp), "solution": f"Step 1: Rewrite as an exponential: log_{base}({val}) = ? means base^? = {val}.\nStep 2: Since {base}^{exp} = {val}, the answer is {exp}.", "domain": "Algebra", "id": "alg_09", "base_difficulty": "Expert", "is_word_problem": False, "source": "seed"}

    def alg_10_arithmetic_sequence(self):
        start = random.randint(1, 10)
        diff = random.randint(2, 5)
        term2 = start + diff
        term3 = start + 2 * diff
        ans = start + 3 * diff
        return {"question": f"Find the 4th term of the arithmetic sequence: {start}, {term2}, {term3}, ...", "answer": str(ans), "solution": f"Step 1: Identify the common difference: {term2} - {start} = {diff}.\nStep 2: The 4th term = 1st term + 3 × difference = {start} + 3×{diff} = {ans}.", "domain": "Algebra", "id": "alg_10", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}


    # ==========================================
    # GEOMETRY TEMPLATES (21-30)
    # ==========================================
    def geom_01_area_rectangle(self):
        w, h = random.randint(3, 10), random.randint(4, 12)
        return {"question": f"Find the area of a rectangle with width = {w} and height = {h}.", "answer": str(w * h), "solution": f"Step 1: Use the formula for area of a rectangle: Area = width × height.\nStep 2: Area = {w} × {h} = {w * h}.", "domain": "Geometry", "id": "geom_01", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def geom_02_perimeter_rectangle(self):
        w, h = random.randint(3, 10), random.randint(4, 12)
        w_plus_h = w + h
        return {"question": f"Find the perimeter of a rectangle with width = {w} and height = {h}.", "answer": str(2 * (w + h)), "solution": f"Step 1: Use the formula for perimeter: P = 2(width + height).\nStep 2: P = 2({w} + {h}) = 2 × {w_plus_h} = {2 * w_plus_h}.", "domain": "Geometry", "id": "geom_02", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def geom_03_triangle_area(self):
        b, h = random.choice([ (4,5), (6,3), (8,5), (10,6) ])
        ans = int(0.5 * b * h)
        return {"question": f"Find the area of a triangle with base = {b} and height = {h}.", "answer": str(ans), "solution": f"Step 1: Use the formula: Area = ½ × base × height.\nStep 2: Area = ½ × {b} × {h} = {ans}.", "domain": "Geometry", "id": "geom_03", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def geom_04_pythagorean_theorem(self):
        a, b, c = random.choice([(3,4,5), (5,12,13), (6,8,10)])
        a_sq = a * a
        b_sq = b * b
        c_sq = a_sq + b_sq
        return {"question": f"In a right-angled triangle, the legs are {a} and {b}. Find the hypotenuse.", "answer": str(c), "solution": f"Step 1: Use the Pythagorean theorem: c² = a² + b².\nStep 2: c² = {a}² + {b}² = {a_sq} + {b_sq} = {c_sq}.\nStep 3: c = √{c_sq} = {c}.", "domain": "Geometry", "id": "geom_04", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def geom_05_circle_area(self):
        r = random.choice([2, 3, 5, 10])
        r_sq = r ** 2
        return {"question": f"Find the area of a circle with radius = {r} in terms of pi (e.g., 25pi).", "answer": f"{r_sq}pi", "solution": f"Step 1: Use the formula: Area = πr².\nStep 2: Area = π × {r}² = {r_sq}π.", "domain": "Geometry", "id": "geom_05", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def geom_06_circle_circumference(self):
        r = random.choice([2, 4, 6, 7])
        result = 2 * r
        return {"question": f"Find the circumference of a circle with radius = {r} in terms of pi (e.g., 10pi).", "answer": f"{result}pi", "solution": f"Step 1: Use the formula: C = 2πr.\nStep 2: C = 2π × {r} = {result}π.", "domain": "Geometry", "id": "geom_06", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def geom_07_volume_cube(self):
        s = random.randint(2, 5)
        return {"question": f"Find the volume of a cube whose side length is {s}.", "answer": str(s**3), "solution": f"Step 1: Use the formula: Volume = s³.\nStep 2: Volume = {s}³ = {s**3}.", "domain": "Geometry", "id": "geom_07", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def geom_08_supplementary_angles(self):
        angle = random.randint(30, 150)
        return {"question": f"Angle A and Angle B are supplementary. If Angle A = {angle}°, find Angle B.", "answer": str(180 - angle), "solution": f"Step 1: Supplementary angles sum to 180°.\nStep 2: Angle B = 180° - {angle}° = {180 - angle}°.", "domain": "Geometry", "id": "geom_08", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def geom_09_interior_angles_polygon(self):
        sides = random.choice([5, 6, 8])
        ans = (sides - 2) * 180
        name = {5: "pentagon", 6: "hexagon", 8: "octagon"}[sides]
        return {"question": f"What is the sum of the interior angles of a regular {name}?", "answer": str(ans), "solution": f"Step 1: Use the formula: Sum = (n - 2) × 180°.\nStep 2: Sum = ({sides} - 2) × 180° = {ans}°.", "domain": "Geometry", "id": "geom_09", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def geom_10_cylinder_volume(self):
        r, h = random.randint(2, 4), random.randint(3, 6)
        ans = (r**2) * h
        return {"question": f"Find the volume of a cylinder with radius = {r} and height = {h} in terms of pi.", "answer": f"{ans}pi", "solution": f"Step 1: Use the formula: Volume = πr²h.\nStep 2: Volume = π × {r}² × {h} = {ans}π.", "domain": "Geometry", "id": "geom_10", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}


    # ==========================================
    # STATISTICS TEMPLATES (31-40)
    # ==========================================
    def stat_01_mean(self):
        nums = [random.randint(1, 10) for _ in range(4)]
        total = sum(nums)
        count = len(nums)
        ans = round(total / count, 2)
        num_str = ', '.join(map(str, nums))
        sum_str = ' + '.join(map(str, nums))
        return {"question": f"Find the mean of these numbers: {num_str}", "answer": str(ans), "solution": f"Step 1: Add all the numbers: {sum_str} = {total}.\nStep 2: Count the numbers: {count}.\nStep 3: Divide sum by count: {total} ÷ {count} = {ans}.", "domain": "Statistics", "id": "stat_01", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def stat_02_median(self):
        nums = sorted([random.randint(1, 20) for _ in range(5)])
        ans = nums[2]
        num_str = ', '.join(map(str, nums))
        return {"question": f"Find the median of this dataset: {num_str}", "answer": str(ans), "solution": f"Step 1: The numbers are already sorted.\nStep 2: With 5 numbers, the median is the middle value: {ans}.", "domain": "Statistics", "id": "stat_02", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def stat_03_mode(self):
        m = random.randint(2, 6)
        nums = [m, m, random.randint(7, 10), random.randint(11, 15)]
        random.shuffle(nums)
        num_str = ', '.join(map(str, nums))
        return {"question": f"Find the mode of this dataset: {num_str}", "answer": str(m), "solution": f"Step 1: Count how many times each number appears.\nStep 2: The number that appears most frequently is {m}.", "domain": "Statistics", "id": "stat_03", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def stat_04_range(self):
        nums = [random.randint(5, 50) for _ in range(5)]
        ans = max(nums) - min(nums)
        num_str = ', '.join(map(str, nums))
        return {"question": f"Find the range of this dataset: {num_str}", "answer": str(ans), "solution": f"Step 1: Identify the largest number ({max(nums)}) and the smallest ({min(nums)}).\nStep 2: Range = {max(nums)} - {min(nums)} = {ans}.", "domain": "Statistics", "id": "stat_04", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def stat_05_basic_probability(self):
        red = random.randint(2, 5)
        blue = random.randint(3, 6)
        total = red + blue
        return {"question": f"A bag contains {red} red marbles and {blue} blue marbles. What is the probability of picking a red marble? (Format: fraction like 2/5)", "answer": f"{red}/{total}", "solution": f"Step 1: Total marbles = {red} + {blue} = {total}.\nStep 2: P(red) = red marbles / total marbles = {red}/{total}.", "domain": "Statistics", "id": "stat_05", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def stat_06_complementary_probability(self):
        pct = random.choice([20, 30, 40, 70, 80])
        return {"question": f"The probability of it raining today is {pct}%. What is the probability that it will NOT rain? (Format: include % symbol)", "answer": f"{100-pct}%", "solution": f"Step 1: P(not rain) = 100% - P(rain).\nStep 2: P(not rain) = 100% - {pct}% = {100-pct}%.", "domain": "Statistics", "id": "stat_06", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}

    def stat_07_independent_probability(self):
        die_target = random.randint(1, 6)
        return {"question": f"If you flip a fair coin and roll a standard 6-sided die, what is the probability of getting Heads and rolling a {die_target}? (Format: fraction)", "answer": "1/12", "solution": f"Step 1: P(Heads) = 1/2. P(rolling {die_target}) = 1/6.\nStep 2: For independent events: P(A and B) = P(A) × P(B) = 1/2 × 1/6 = 1/12.", "domain": "Statistics", "id": "stat_07", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def stat_08_weighted_mean(self):
        return {"question": "A student scores 80 on a test weighted at 40% and 90 on a final exam weighted at 60%. Find the final score.", "answer": "86", "solution": "Step 1: Multiply each score by its weight: 80 × 0.40 = 32, 90 × 0.60 = 54.\nStep 2: Add the weighted scores: 32 + 54 = 86.", "domain": "Statistics", "id": "stat_08", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def stat_09_factorial(self):
        n = random.choice([4, 5])
        ans = math.factorial(n)
        return {"question": f"Evaluate the factorial expression: {n}!", "answer": str(ans), "solution": f"Step 1: {n}! = {n} × {n-1} × ... × 2 × 1.\nStep 2: = {ans}.", "domain": "Statistics", "id": "stat_09", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def stat_10_permutations(self):
        return {"question": "How many ways can a President and Vice President be elected from a group of 5 people?", "answer": "20", "solution": "Step 1: For President: 5 choices. For Vice President: 4 remaining choices.\nStep 2: Total = 5 × 4 = 20.", "domain": "Statistics", "id": "stat_10", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}


    # ==========================================
    # TRIGONOMETRY TEMPLATES (41-50)
    # ==========================================
    def trig_01_soh_sin(self):
        return {"question": "In a right triangle, if the opposite side is 3 and the hypotenuse is 5, what is sin(θ)? (Format: fraction)", "answer": "3/5", "solution": "Step 1: SOH: sin(θ) = Opposite / Hypotenuse.\nStep 2: sin(θ) = 3 / 5.", "domain": "Trigonometry", "id": "trig_01", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def trig_02_cah_cos(self):
        return {"question": "In a right triangle, if the adjacent side is 4 and the hypotenuse is 5, what is cos(θ)? (Format: fraction)", "answer": "4/5", "solution": "Step 1: CAH: cos(θ) = Adjacent / Hypotenuse.\nStep 2: cos(θ) = 4 / 5.", "domain": "Trigonometry", "id": "trig_02", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def trig_03_toa_tan(self):
        return {"question": "In a right triangle, if the opposite side is 3 and the adjacent side is 4, what is tan(θ)? (Format: fraction)", "answer": "3/4", "solution": "Step 1: TOA: tan(θ) = Opposite / Adjacent.\nStep 2: tan(θ) = 3 / 4.", "domain": "Trigonometry", "id": "trig_03", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def trig_04_pythagorean_identity(self):
        return {"question": "Simplify the expression: sin²(θ) + cos²(θ)", "answer": "1", "solution": "Step 1: Recall the Pythagorean identity: sin²(θ) + cos²(θ) = 1.\nStep 2: Therefore, the answer is 1.", "domain": "Trigonometry", "id": "trig_04", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def trig_05_deg_to_rad(self):
        deg = random.choice([180, 90, 360])
        ans = {180: "pi", 90: "pi/2", 360: "2pi"}[deg]
        return {"question": f"Convert {deg} degrees to radians.", "answer": ans, "solution": f"Step 1: Multiply by π/180: {deg} × π/180 = {deg}/180 π.\nStep 2: Simplify: {ans}.", "domain": "Trigonometry", "id": "trig_05", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def trig_06_rad_to_deg(self):
        return {"question": "Convert pi/4 radians to degrees.", "answer": "45", "solution": "Step 1: Multiply by 180/π: (π/4) × (180/π) = 180/4.\nStep 2: = 45°.", "domain": "Trigonometry", "id": "trig_06", "base_difficulty": "Intermediate", "is_word_problem": False, "source": "seed"}

    def trig_07_unit_circle_sin(self):
        return {"question": "What is the exact value of sin(90°)?", "answer": "1", "solution": "Step 1: On the unit circle, at 90°, the coordinates are (0, 1).\nStep 2: sin(θ) = y-coordinate = 1.", "domain": "Trigonometry", "id": "trig_07", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def trig_08_unit_circle_cos(self):
        return {"question": "What is the exact value of cos(180°)?", "answer": "-1", "solution": "Step 1: On the unit circle, at 180°, the coordinates are (-1, 0).\nStep 2: cos(θ) = x-coordinate = -1.", "domain": "Trigonometry", "id": "trig_08", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def trig_09_coterminal_angle(self):
        angle = random.choice([390, 420])
        ans = angle - 360
        return {"question": f"Find a positive coterminal angle for {angle}° between 0° and 360°.", "answer": str(ans), "solution": f"Step 1: Subtract 360°: {angle}° - 360° = {ans}°.\nStep 2: {ans}° is between 0° and 360°.", "domain": "Trigonometry", "id": "trig_09", "base_difficulty": "Advanced", "is_word_problem": False, "source": "seed"}

    def trig_10_amplitude_periodic(self):
        amp = random.randint(2, 6)
        return {"question": f"What is the amplitude of the function y = {amp}sin(x)?", "answer": str(amp), "solution": f"Step 1: For y = A sin(x), the amplitude is |A|.\nStep 2: Amplitude = {amp}.", "domain": "Trigonometry", "id": "trig_10", "base_difficulty": "Novice", "is_word_problem": False, "source": "seed"}