import random
import math

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

    # ==========================================
    # ARITHMETIC TEMPLATES (1-10)
    # ==========================================
    def arith_01_basic_addition(self):
        a, b = random.randint(10, 99), random.randint(10, 99)
        return {"question": f"Calculate: {a} + {b}", "answer": str(a + b), "domain": "Arithmetic", "id": "arith_01", "base_difficulty": "Novice"}

    def arith_02_subtraction_negative(self):
        a, b = random.randint(50, 150), random.randint(60, 200)
        return {"question": f"Calculate: {a} - {b}", "answer": str(a - b), "domain": "Arithmetic", "id": "arith_02", "base_difficulty": "Novice"}

    def arith_03_multiplication_mesh(self):
        a, b = random.randint(6, 15), random.randint(6, 12)
        return {"question": f"Calculate: {a} × {b}", "answer": str(a * b), "domain": "Arithmetic", "id": "arith_03", "base_difficulty": "Novice"}

    def arith_04_integer_division(self):
        b = random.randint(4, 12)
        ans = random.randint(5, 15)
        a = b * ans
        return {"question": f"Calculate: {a} ÷ {b}", "answer": str(ans), "domain": "Arithmetic", "id": "arith_04", "base_difficulty": "Novice"}

    def arith_05_order_of_ops(self):
        a, b, c = random.randint(2, 6), random.randint(3, 8), random.randint(1, 10)
        return {"question": f"Simplify using PEMDAS: {a} + {b} × {c}", "answer": str(a + (b * c)), "domain": "Arithmetic", "id": "arith_05", "base_difficulty": "Intermediate"}

    def arith_06_fraction_addition(self):
        # Same denominator for clean input
        den = random.choice([3, 4, 5, 7])
        num1 = random.randint(1, den - 1)
        num2 = random.randint(1, den - 1)
        return {"question": f"Add the fractions: {num1}/{den} + {num2}/{den}", "answer": f"{num1+num2}/{den}", "domain": "Arithmetic", "id": "arith_06", "base_difficulty": "Intermediate"}

    def arith_07_decimal_multiplication(self):
        a = round(random.uniform(1.1, 4.9), 1)
        b = 2
        return {"question": f"Calculate: {a} × {b}", "answer": str(round(a * b, 1)), "domain": "Arithmetic", "id": "arith_07", "base_difficulty": "Intermediate"}

    def arith_08_percentage_of_value(self):
        pct = random.choice([10, 20, 25, 50])
        val = random.randint(1, 10) * 40
        ans = int((pct / 100) * val)
        return {"question": f"What is {pct}% of {val}?", "answer": str(ans), "domain": "Arithmetic", "id": "arith_08", "base_difficulty": "Intermediate"}

    def arith_09_lcm(self):
        a, b = random.choice([(4,6), (3,5), (6,8), (4,10)])
        ans = math.lcm(a, b)
        return {"question": f"Find the Least Common Multiple (LCM) of {a} and {b}", "answer": str(ans), "domain": "Arithmetic", "id": "arith_09", "base_difficulty": "Advanced"}

    def arith_10_gcd(self):
        a, b = random.choice([(12,18), (24,36), (15,45), (18,24)])
        ans = math.gcd(a, b)
        return {"question": f"Find the Greatest Common Divisor (GCD) of {a} and {b}", "answer": str(ans), "domain": "Arithmetic", "id": "arith_10", "base_difficulty": "Advanced"}


    # ==========================================
    # ALGEBRA TEMPLATES (11-20)
    # ==========================================
    def alg_01_linear_one_step(self):
        x = random.randint(2, 15)
        a = random.randint(5, 30)
        return {"question": f"Solve for x: x + {a} = {x + a}", "answer": str(x), "domain": "Algebra", "id": "alg_01", "base_difficulty": "Novice"}

    def alg_02_linear_two_step(self):
        x = random.randint(1, 10)
        a = random.randint(2, 9)
        b = random.randint(1, 20)
        return {"question": f"Solve for x: {a}x + {b} = {a*x + b}", "answer": str(x), "domain": "Algebra", "id": "alg_02", "base_difficulty": "Intermediate"}

    def alg_03_simplify_expression(self):
        a, b = random.randint(2, 6), random.randint(2, 6)
        return {"question": f"Simplify: {a}x + {b} + {a}x", "answer": f"{2*a}x+{b}", "domain": "Algebra", "id": "alg_03", "base_difficulty": "Intermediate"}

    def alg_04_quadratic_factored(self):
        # (x - r1)(x - r2) = x^2 - (r1+r2)x + r1*r2
        r1, r2 = random.randint(1, 5), random.randint(1, 5)
        b = -(r1 + r2)
        c = r1 * r2
        sign = "-" if b < 0 else "+"
        abs_b = abs(b)
        return {"question": f"Find the positive roots/solutions of x² {sign} {abs_b}x + {c} = 0. Separate with a comma if distinct.", "answer": f"{r1},{r2}" if r1 != r2 else str(r1), "domain": "Algebra", "id": "alg_04", "base_difficulty": "Advanced"}

    def alg_05_exponent_rules(self):
        p1, p2 = random.randint(2, 5), random.randint(2, 5)
        return {"question": f"Simplify: (x^{p1}) * (x^{p2})", "answer": f"x^{p1+p2}", "domain": "Algebra", "id": "alg_05", "base_difficulty": "Intermediate"}

    def alg_06_system_linear(self):
        # x + y = s, x - y = d
        x, y = random.randint(5, 10), random.randint(1, 4)
        s, d = x + y, x - y
        return {"question": f"Given the system: x + y = {s} and x - y = {d}. What is the value of x?", "answer": str(x), "domain": "Algebra", "id": "alg_06", "base_difficulty": "Advanced"}

    def alg_07_absolute_value(self):
        x_pos = random.randint(2, 8)
        b = random.randint(1, 5)
        ans = x_pos + b
        return {"question": f"Solve for positive x: |x - {b}| = {x_pos}", "answer": str(ans), "domain": "Algebra", "id": "alg_07", "base_difficulty": "Intermediate"}

    def alg_08_linear_inequality(self):
        # ax > b -> x > ans
        a = random.choice([2, 3, 5])
        ans = random.randint(2, 6)
        b = a * ans
        return {"question": f"Solve the inequality: {a}x > {b}", "answer": f"x>{ans}", "domain": "Algebra", "id": "alg_08", "base_difficulty": "Intermediate"}

    def alg_09_log_to_exponential(self):
        base = random.choice([2, 3, 10])
        exp = random.randint(2, 4)
        val = base ** exp
        return {"question": f"Evaluate: log_{base}({val})", "answer": str(exp), "domain": "Algebra", "id": "alg_09", "base_difficulty": "Expert"}

    def alg_10_arithmetic_sequence(self):
        start = random.randint(1, 10)
        diff = random.randint(2, 5)
        # 4th term = start + 3*diff
        ans = start + 3 * diff
        return {"question": f"Find the 4th term of the arithmetic sequence: {start}, {start+diff}, {start+2*diff}, ...", "answer": str(ans), "domain": "Algebra", "id": "alg_10", "base_difficulty": "Advanced"}


    # ==========================================
    # GEOMETRY TEMPLATES (21-30)
    # ==========================================
    def geom_01_area_rectangle(self):
        w, h = random.randint(3, 10), random.randint(4, 12)
        return {"question": f"Find the area of a rectangle with width = {w} and height = {h}.", "answer": str(w * h), "domain": "Geometry", "id": "geom_01", "base_difficulty": "Novice"}

    def geom_02_perimeter_rectangle(self):
        w, h = random.randint(3, 10), random.randint(4, 12)
        return {"question": f"Find the perimeter of a rectangle with width = {w} and height = {h}.", "answer": str(2 * (w + h)), "domain": "Geometry", "id": "geom_02", "base_difficulty": "Novice"}

    def geom_03_triangle_area(self):
        b, h = random.choice([ (4,5), (6,3), (8,5), (10,6) ])
        ans = int(0.5 * b * h)
        return {"question": f"Find the area of a triangle with base = {b} and height = {h}.", "answer": str(ans), "domain": "Geometry", "id": "geom_03", "base_difficulty": "Intermediate"}

    def geom_04_pythagorean_theorem(self):
        # Using pythagorean triples
        a, b, c = random.choice([(3,4,5), (5,12,13), (6,8,10)])
        return {"question": f"In a right-angled triangle, the legs are {a} and {b}. Find the hypotenuse.", "answer": str(c), "domain": "Geometry", "id": "geom_04", "base_difficulty": "Intermediate"}

    def geom_05_circle_area(self):
        r = random.choice([2, 3, 5, 10])
        return {"question": f"Find the area of a circle with radius = {r} in terms of pi (e.g., 25pi).", "answer": f"{r**2}pi", "domain": "Geometry", "id": "geom_05", "base_difficulty": "Intermediate"}

    def geom_06_circle_circumference(self):
        r = random.choice([2, 4, 6, 7])
        return {"question": f"Find the circumference of a circle with radius = {r} in terms of pi (e.g., 10pi).", "answer": f"{2*r}pi", "domain": "Geometry", "id": "geom_06", "base_difficulty": "Intermediate"}

    def geom_07_volume_cube(self):
        s = random.randint(2, 5)
        return {"question": f"Find the volume of a cube whose side length is {s}.", "answer": str(s**3), "domain": "Geometry", "id": "geom_07", "base_difficulty": "Intermediate"}

    def geom_08_supplementary_angles(self):
        angle = random.randint(30, 150)
        return {"question": f"Angle A and Angle B are supplementary. If Angle A = {angle}°, find Angle B.", "answer": str(180 - angle), "domain": "Geometry", "id": "geom_08", "base_difficulty": "Novice"}

    def geom_09_interior_angles_polygon(self):
        # (n-2)*180
        sides = random.choice([5, 6, 8])
        ans = (sides - 2) * 180
        name = {5: "pentagon", 6: "hexagon", 8: "octagon"}[sides]
        return {"question": f"What is the sum of the interior angles of a regular {name}?", "answer": str(ans), "domain": "Geometry", "id": "geom_09", "base_difficulty": "Advanced"}

    def geom_10_cylinder_volume(self):
        r, h = random.randint(2, 4), random.randint(3, 6)
        ans = (r**2) * h
        return {"question": f"Find the volume of a cylinder with radius = {r} and height = {h} in terms of pi.", "answer": f"{ans}pi", "domain": "Geometry", "id": "geom_10", "base_difficulty": "Advanced"}


    # ==========================================
    # STATISTICS TEMPLATES (31-40)
    # ==========================================
    def stat_01_mean(self):
        nums = [random.randint(1, 10) for _ in range(4)]
        ans = sum(nums) / 4
        return {"question": f"Find the mean of these numbers: {', '.join(map(str, nums))}", "answer": str(round(ans, 2)), "domain": "Statistics", "id": "stat_01", "base_difficulty": "Intermediate"}

    def stat_02_median(self):
        nums = sorted([random.randint(1, 20) for _ in range(5)])
        ans = nums[2]
        return {"question": f"Find the median of this dataset: {', '.join(map(str, nums))}", "answer": str(ans), "domain": "Statistics", "id": "stat_02", "base_difficulty": "Intermediate"}

    def stat_03_mode(self):
        m = random.randint(2, 6)
        nums = [m, m, random.randint(7, 10), random.randint(11, 15)]
        random.shuffle(nums)
        return {"question": f"Find the mode of this dataset: {', '.join(map(str, nums))}", "answer": str(m), "domain": "Statistics", "id": "stat_03", "base_difficulty": "Novice"}

    def stat_04_range(self):
        nums = [random.randint(5, 50) for _ in range(5)]
        ans = max(nums) - min(nums)
        return {"question": f"Find the range of this dataset: {', '.join(map(str, nums))}", "answer": str(ans), "domain": "Statistics", "id": "stat_04", "base_difficulty": "Novice"}

    def stat_05_basic_probability(self):
        red = random.randint(2, 5)
        blue = random.randint(3, 6)
        total = red + blue
        return {"question": f"A bag contains {red} red marbles and {blue} blue marbles. What is the probability of picking a red marble? (Format: fraction like 2/5)", "answer": f"{red}/{total}", "domain": "Statistics", "id": "stat_05", "base_difficulty": "Novice"}

    def stat_06_complementary_probability(self):
        pct = random.choice([20, 30, 40, 70, 80])
        return {"question": f"The probability of it raining today is {pct}%. What is the probability that it will NOT rain? (Format: include % symbol)", "answer": f"{100-pct}%", "domain": "Statistics", "id": "stat_06", "base_difficulty": "Novice"}

    def stat_07_independent_probability(self):
        # Flipping a coin (1/2) and rolling a die (1/6)
        die_target = random.randint(1, 6)
        return {"question": f"If you flip a fair coin and roll a standard 6-sided die, what is the probability of getting Heads and rolling a {die_target}? (Format: fraction)", "answer": "1/12", "domain": "Statistics", "id": "stat_07", "base_difficulty": "Advanced"}

    def stat_08_weighted_mean(self):
        return {"question": "A student scores 80 on a test weighted at 40% and 90 on a final exam weighted at 60%. Find the final score.", "answer": "86", "domain": "Statistics", "id": "stat_08", "base_difficulty": "Advanced"}

    def stat_09_factorial(self):
        n = random.choice([4, 5])
        return {"question": f"Evaluate the factorial expression: {n}!", "answer": str(math.factorial(n)), "domain": "Statistics", "id": "stat_09", "base_difficulty": "Intermediate"}

    def stat_10_permutations(self):
        # nPr downscale
        return {"question": "How many ways can a President and Vice President be elected from a group of 5 people?", "answer": "20", "domain": "Statistics", "id": "stat_10", "base_difficulty": "Advanced"}


    # ==========================================
    # TRIGONOMETRY TEMPLATES (41-50)
    # ==========================================
    def trig_01_soh_sin(self):
        return {"question": "In a right triangle, if the opposite side is 3 and the hypotenuse is 5, what is sin(θ)? (Format: fraction)", "answer": "3/5", "domain": "Trigonometry", "id": "trig_01", "base_difficulty": "Intermediate"}

    def trig_02_cah_cos(self):
        return {"question": "In a right triangle, if the adjacent side is 4 and the hypotenuse is 5, what is cos(θ)? (Format: fraction)", "answer": "4/5", "domain": "Trigonometry", "id": "trig_02", "base_difficulty": "Intermediate"}

    def trig_03_toa_tan(self):
        return {"question": "In a right triangle, if the opposite side is 3 and the adjacent side is 4, what is tan(θ)? (Format: fraction)", "answer": "3/4", "domain": "Trigonometry", "id": "trig_03", "base_difficulty": "Intermediate"}

    def trig_04_pythagorean_identity(self):
        return {"question": "Simplify the expression: sin²(θ) + cos²(θ)", "answer": "1", "domain": "Trigonometry", "id": "trig_04", "base_difficulty": "Intermediate"}

    def trig_05_deg_to_rad(self):
        deg = random.choice([180, 90, 360])
        ans = {180: "pi", 90: "pi/2", 360: "2pi"}[deg]
        return {"question": f"Convert {deg} degrees to radians.", "answer": ans, "domain": "Trigonometry", "id": "trig_05", "base_difficulty": "Intermediate"}

    def trig_06_rad_to_deg(self):
        return {"question": "Convert pi/4 radians to degrees.", "answer": "45", "domain": "Trigonometry", "id": "trig_06", "base_difficulty": "Intermediate"}

    def trig_07_unit_circle_sin(self):
        return {"question": "What is the exact value of sin(90°)?", "answer": "1", "domain": "Trigonometry", "id": "trig_07", "base_difficulty": "Advanced"}

    def trig_08_unit_circle_cos(self):
        return {"question": "What is the exact value of cos(180°)?", "answer": "-1", "domain": "Trigonometry", "id": "trig_08", "base_difficulty": "Advanced"}

    def trig_09_coterminal_angle(self):
        angle = random.choice([390, 420])
        ans = angle - 360
        return {"question": f"Find a positive coterminal angle for {angle}° between 0° and 360°.", "answer": str(ans), "domain": "Trigonometry", "id": "trig_09", "base_difficulty": "Advanced"}

    def trig_10_amplitude_periodic(self):
        amp = random.randint(2, 6)
        return {"question": f"What is the amplitude of the function y = {amp}sin(x)?", "answer": str(amp), "domain": "Trigonometry", "id": "trig_10", "base_difficulty": "Novice"}