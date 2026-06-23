"""
Django management command to seed learning resources from free online sources.

Usage:
    python manage.py seed_learning_resources
"""
from django.core.management.base import BaseCommand
from playthrough.models import LearningResource
from topics.models import Topic


class Command(BaseCommand):
    help = "Seed learning resources (PhET simulations + Khan Academy links) for Philippine education system"

    def handle(self, *args, **options):
        self.stdout.write("Seeding learning resources...")

        # Philippine education system:
        # Elementary: Grades 1-6
        # Junior High: Grades 7-10
        # Senior High: Not included yet
        resources_data = [
            # ==================== ARITHMETIC ====================
            {
                'topic_name': 'Arithmetic',
                'grade_level': 'Elementary',
                'resource_type': 'PHET',
                'title': 'Number Line',
                'embed_url': 'https://phet.colorado.edu/sims/html/number-line/latest/number-line_en.html',
                'description': 'Interactive number line for learning integers, addition, and subtraction.',
                'order': 1
            },
            {
                'topic_name': 'Arithmetic',
                'grade_level': 'Elementary',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Basic Addition and Subtraction',
                'embed_url': 'https://www.khanacademy.org/math/arithmetic/addition-subtraction',
                'description': 'Learn the fundamentals of addition and subtraction. (Opens in new tab)',
                'order': 2
            },
            {
                'topic_name': 'Arithmetic',
                'grade_level': 'Junior High',
                'resource_type': 'PHET',
                'title': 'Fraction Matcher',
                'embed_url': 'https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_en.html',
                'description': 'Match fractions using visual models and number lines.',
                'order': 1
            },
            {
                'topic_name': 'Arithmetic',
                'grade_level': 'Junior High',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Fractions and Decimals',
                'embed_url': 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic',
                'description': 'Master fractions, decimals, and their relationships. (Opens in new tab)',
                'order': 2
            },

            # ==================== ALGEBRA ====================
            {
                'topic_name': 'Algebra',
                'grade_level': 'Elementary',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Introduction to Variables',
                'embed_url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:variables-expressions',
                'description': 'Learn what variables are and how to use them in simple expressions. (Opens in new tab)',
                'order': 1
            },
            {
                'topic_name': 'Algebra',
                'grade_level': 'Junior High',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Linear Equations and Inequalities',
                'embed_url': 'https://www.khanacademy.org/math/algebra/linear-equations',
                'description': 'Solve one-step and two-step linear equations and inequalities. (Opens in new tab)',
                'order': 1
            },
            {
                'topic_name': 'Algebra',
                'grade_level': 'Junior High',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Quadratic Functions and Equations',
                'embed_url': 'https://www.khanacademy.org/math/algebra/quadratics',
                'description': 'Deep dive into quadratic equations, factoring, and the quadratic formula. (Opens in new tab)',
                'order': 2
            },

            # ==================== GEOMETRY ====================
            {
                'topic_name': 'Geometry',
                'grade_level': 'Elementary',
                'resource_type': 'PHET',
                'title': 'Shape Builder',
                'embed_url': 'https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_en.html',
                'description': 'Explore shapes, area, and perimeter through interactive building activities.',
                'order': 1
            },
            {
                'topic_name': 'Geometry',
                'grade_level': 'Elementary',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Basic Shapes and Angles',
                'embed_url': 'https://www.khanacademy.org/math/geometry/basic-geometry',
                'description': 'Learn about points, lines, angles, and basic geometric shapes. (Opens in new tab)',
                'order': 2
            },
            {
                'topic_name': 'Geometry',
                'grade_level': 'Junior High',
                'resource_type': 'PHET',
                'title': 'Polygon Builder',
                'embed_url': 'https://phet.colorado.edu/sims/html/polygon/latest/polygon_en.html',
                'description': 'Build and explore properties of polygons.',
                'order': 1
            },
            {
                'topic_name': 'Geometry',
                'grade_level': 'Junior High',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Triangle Properties and Proofs',
                'embed_url': 'https://www.khanacademy.org/math/geometry/triangle-properties',
                'description': 'Study triangle congruence, similarity, and geometric proofs. (Opens in new tab)',
                'order': 2
            },

            # ==================== STATISTICS ====================
            {
                'topic_name': 'Statistics',
                'grade_level': 'Elementary',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Data and Graphing Basics',
                'embed_url': 'https://www.khanacademy.org/math/statistics-probability/data',
                'description': 'Learn to collect, organize, and display data using bar graphs and pictographs. (Opens in new tab)',
                'order': 1
            },
            {
                'topic_name': 'Statistics',
                'grade_level': 'Junior High',
                'resource_type': 'PHET',
                'title': 'Plinko Probability',
                'embed_url': 'https://phet.colorado.edu/sims/html/plinko-probability/latest/plinko-probability_en.html',
                'description': 'Explore probability distributions through the Plinko board simulation.',
                'order': 1
            },
            {
                'topic_name': 'Statistics',
                'grade_level': 'Junior High',
                'resource_type': 'PHET',
                'title': 'Normal Distribution',
                'embed_url': 'https://phet.colorado.edu/sims/html/normal-distribution/latest/normal-distribution_en.html',
                'description': 'Explore the properties of the normal distribution and standard deviation.',
                'order': 2
            },

            # ==================== TRIGONOMETRY ====================
            {
                'topic_name': 'Trigonometry',
                'grade_level': 'Junior High',
                'resource_type': 'KHAN_ACADEMY',
                'title': 'Trigonometric Ratios and Functions',
                'embed_url': 'https://www.khanacademy.org/math/trigonometry',
                'description': 'Learn sine, cosine, tangent, and their applications in right triangles. (Opens in new tab)',
                'order': 1
            },
        ]

        created_count = 0
        skipped_count = 0

        for resource_data in resources_data:
            try:
                topic = Topic.objects.get(name=resource_data['topic_name'])
                
                # Create resource
                resource, created = LearningResource.objects.get_or_create(
                    topic=topic,
                    grade_level=resource_data['grade_level'],
                    title=resource_data['title'],
                    defaults={
                        'resource_type': resource_data['resource_type'],
                        'embed_url': resource_data['embed_url'],
                        'description': resource_data['description'],
                        'order': resource_data['order'],
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Created: {resource}")
                    )
                else:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"  - Skipped (exists): {resource}")
                    )
                    
            except Topic.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Topic not found: {resource_data['topic_name']}")
                )
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Seeding complete! Created: {created_count}, Skipped: {skipped_count}"
            )
        )