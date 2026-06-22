"""
Django management command to seed learning resources from free online sources.

Usage:
    python manage.py seed_learning_resources
"""
from django.core.management.base import BaseCommand
from playthrough.models import LearningResource
from topics.models import Topic


class Command(BaseCommand):
    help = "Seed learning resources (PhET simulations + YouTube videos + external links)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding learning resources...")

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
                'resource_type': 'YOUTUBE',
                'title': 'Basic Addition and Subtraction (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/1xKQcGmYG6E',
                'description': 'Learn the fundamentals of addition and subtraction with visual aids.',
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
                'resource_type': 'YOUTUBE',
                'title': 'Fractions and Decimals (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/6oo3H-t-mxM',
                'description': 'Master fractions, decimals, and their relationships.',
                'order': 2
            },
            {
                'topic_name': 'Arithmetic',
                'grade_level': 'Senior High',
                'resource_type': 'YOUTUBE',
                'title': 'Arithmetic Properties (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/7WOmP5cN6-U',
                'description': 'Advanced arithmetic including order of operations and properties.',
                'order': 1
            },

            # ==================== ALGEBRA ====================
            {
                'topic_name': 'Algebra',
                'grade_level': 'Elementary',
                'resource_type': 'YOUTUBE',
                'title': 'Introduction to Variables (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/vDq0JNJF5hM',
                'description': 'Learn what variables are and how to use them in simple expressions.',
                'order': 1
            },
            {
                'topic_name': 'Algebra',
                'grade_level': 'Junior High',
                'resource_type': 'YOUTUBE',
                'title': 'Linear Equations and Inequalities (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/5TqIJWXhM6Y',
                'description': 'Solve one-step and two-step linear equations and inequalities.',
                'order': 1
            },
            {
                'topic_name': 'Algebra',
                'grade_level': 'Senior High',
                'resource_type': 'YOUTUBE',
                'title': 'Quadratic Functions and Equations (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/i7tbzF7VHQs',
                'description': 'Deep dive into quadratic equations, factoring, and the quadratic formula.',
                'order': 1
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
                'resource_type': 'YOUTUBE',
                'title': 'Basic Shapes and Angles (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/1yGJwO-fNQY',
                'description': 'Learn about points, lines, angles, and basic geometric shapes.',
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
                'grade_level': 'Senior High',
                'resource_type': 'YOUTUBE',
                'title': 'Triangle Properties and Proofs (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/1yGJwO-fNQY',
                'description': 'Study triangle congruence, similarity, and geometric proofs.',
                'order': 1
            },

            # ==================== STATISTICS ====================
            {
                'topic_name': 'Statistics',
                'grade_level': 'Elementary',
                'resource_type': 'YOUTUBE',
                'title': 'Data and Graphing Basics (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/9uu8gG9hW3M',
                'description': 'Learn to collect, organize, and display data using bar graphs and pictographs.',
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
                'grade_level': 'Senior High',
                'resource_type': 'PHET',
                'title': 'Normal Distribution',
                'embed_url': 'https://phet.colorado.edu/sims/html/normal-distribution/latest/normal-distribution_en.html',
                'description': 'Explore the properties of the normal distribution and standard deviation.',
                'order': 2
            },

            # ==================== TRIGONOMETRY ====================
            {
                'topic_name': 'Trigonometry',
                'grade_level': 'Senior High',
                'resource_type': 'YOUTUBE',
                'title': 'Trigonometric Ratios and Functions (Khan Academy)',
                'embed_url': 'https://www.youtube.com/embed/7qzcPGjEf4A',
                'description': 'Learn sine, cosine, tangent, and their applications in right triangles.',
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