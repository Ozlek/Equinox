from .models import UserProgress, UnlockedAchievement

class AchievementRegistry:
    """
    Central hub for all Equinox achievements. 
    To add a new achievement, simply add a new dictionary entry here.
    """
    
    BADGES = {
        "first_steps": {
            "title": "First Steps",
            "description": "Complete your very first Equinox playthrough.",
            "icon": "🌱",
            # The condition is a lambda function that receives the user and evaluates to True/False
            "condition": lambda user: UserProgress.objects.filter(user=user).order_by('-completed_at').first() is not None
        },
        "algebra_master_1": {
            "title": "Algebra Initiate",
            "description": "Achieve an 80% or higher in 10 different Algebra sessions.",
            "icon": "📐",
            "condition": lambda user: UserProgress.objects.filter(
                user=user, 
                topic__name="Algebra", 
                score__gte=8 # Assuming MAX_QUESTIONS_PER_SESSION is 10, 80% is 8
            ).count() >= 10
        },
        "flawless_victory": {
            "title": "Flawless Execution",
            "description": "Score a perfect 10/10 on Expert difficulty.",
            "icon": "👑",
            "condition": lambda user: UserProgress.objects.filter(
                user=user,
                score=10,
                difficulty="Expert"
            ).order_by('-completed_at').first() is not None
        }
    }

    @classmethod
    def evaluate_user(cls, user):
        """
        Scans all available badges. If the user meets the condition and 
        doesn't have the badge yet, it unlocks it and returns a list of new unlocks.
        """
        newly_unlocked = []
        
        # Get a list of IDs the user already owns to skip redundant checks
        # Convert QuerySet to list for proper 'in' operator support
        already_unlocked_ids = list(UnlockedAchievement.objects.filter(user=user).values_list('achievement_id', flat=True))

        for badge_id, badge_data in cls.BADGES.items():
            if badge_id in already_unlocked_ids:
                continue # Skip if already earned
                
            # Run the specific condition logic for this badge
            if badge_data["condition"](user):
                UnlockedAchievement.objects.create(user=user, achievement_id=badge_id)
                newly_unlocked.append({
                    "id": badge_id,
                    "title": badge_data["title"],
                    "description": badge_data["description"],
                    "icon": badge_data["icon"]
                })
                
        return newly_unlocked
