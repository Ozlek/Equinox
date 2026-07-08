#!/usr/bin/env python
"""
Seed the shop with default items.

Run from backend directory:
    python manage.py seed_shop_items
"""
from django.core.management.base import BaseCommand
from playthrough.models import GamifiedModifier, ShopItem


class Command(BaseCommand):
    help = "Seed the shop with default power-up items"

    def handle(self, *args, **options):
        # Define shop items with their full configuration
        # Each item includes modifier details for creation if needed
        shop_items = [
            # Score boost multipliers
            {
                "slug": "double-xp",
                "name": "Double XP",
                "type": "SCORE_BOOST",
                "value": 2.0,
                "price": 15,
                "description": "2x score multiplier for this playthrough"
            },
            {
                "slug": "score-boost",
                "name": "Score Boost",
                "type": "SCORE_BOOST",
                "value": 1.5,
                "price": 10,
                "description": "1.5x score multiplier for this playthrough"
            },
            # Streak protection
            {
                "slug": "streak-shield",
                "name": "Streak Shield",
                "type": "STREAK_SHIELD",
                "value": 1.0,
                "price": 8,
                "description": "Protects your streak on one wrong answer"
            },
            # DDA lock (uses SCORE_BOOST type with 1.0 multiplier - effect is handled in session logic)
            {
                "slug": "dda_adjuster",
                "name": "DDA Adjuster",
                "type": "SCORE_BOOST",
                "value": 1.0,
                "price": 5,
                "description": "Locks DDA for this playthrough"
            },
        ]

        created_modifiers = 0
        created_shop_items = 0
        
        for item_data in shop_items:
            # Get or create the modifier - this is the fix!
            modifier, modifier_created = GamifiedModifier.objects.get_or_create(
                slug=item_data["slug"],
                defaults={
                    "name": item_data["name"],
                    "modifier_type": item_data["type"],
                    "multiplier_value": item_data["value"],
                    "description": item_data["description"]
                }
            )
            if modifier_created:
                created_modifiers += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Created modifier: {modifier.name}")
                )

            # Create or update the shop item
            shop_item, was_created = ShopItem.objects.get_or_create(
                modifier=modifier,
                defaults={"price": item_data["price"], "is_available": True}
            )
            if was_created:
                created_shop_items += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Added {modifier.name} - {item_data['price']}⭐")
                )
            else:
                self.stdout.write(f"  - {modifier.name} already in shop")

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seeded {created_modifiers} modifiers and {created_shop_items} shop items!"
        ))