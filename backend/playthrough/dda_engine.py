import math
from .models import ResponseLog, UserSkillProfile

class EquinoxDDAEngine:
    """
    Dual-Algorithmic DDA Subsystem for Equinox.
    Combines Rule-Based Thresholding and a Bayesian Probabilistic update framework.
    """

    DIFFICULTY_TIERS = {
        "Novice": 1.0,
        "Intermediate": 2.0,
        "Advanced": 3.0,
        "Expert": 4.0
    }

    @classmethod
    def get_closest_tier(cls, numeric_rating):
        """Converts a continuous DDA rating back into a discrete template tier."""
        if numeric_rating < 1.8: return "Novice"
        if numeric_rating < 2.8: return "Intermediate"
        if numeric_rating < 3.8: return "Advanced"
        return "Expert"

    # --- NEW METHOD FOR INITIAL SEEDING ---
    @classmethod
    def seed_initial_rating(cls, user, domain, difficulty_str):
        """
        Seeds the UserSkillProfile with the starting difficulty chosen by the user in the UI.
        Converts frontend strings (e.g., 'novice') to backend engine values (e.g., 1.0).
        """
        # Ensure proper capitalization ('novice' -> 'Novice')
        formatted_diff = str(difficulty_str).capitalize()
        
        # Get numeric value, fallback to Intermediate (2.0) if something goes wrong
        initial_numeric = cls.DIFFICULTY_TIERS.get(formatted_diff, 2.0)
        
        # Fetch or instantiate profile, then forcefully save the seed value
        profile, _ = UserSkillProfile.objects.get_or_create(user=user)
        profile.update_rating(domain, initial_numeric)
        
        return initial_numeric

    def adjust_difficulty(self, user, domain, question_obj, is_correct):
        """
        Main pipeline executed on every quiz answer submission.
        """
        # 1. Fetch current profile
        profile, _ = UserSkillProfile.objects.get_or_create(user=user)
        current_rating = profile.get_rating(domain)
        target_difficulty = self.DIFFICULTY_TIERS.get(question_obj.difficulty, 1.0)

        # 2. Log response to database for historical probability tracking
        ResponseLog.objects.create(
            user=user,
            domain=domain,
            question=question_obj,
            question_difficulty_value=target_difficulty,
            is_correct=is_correct
        )

        # 3. Calculate adjustment via both frameworks
        rule_adjustment = self._rule_based_thresholding(user, domain, is_correct)
        prob_adjustment = self._probabilistic_learning_factor(user, domain, target_difficulty, is_correct)

        # 4. Synthesize adjustments into a new rating
        # Balance weight: 60% rule stability, 40% empirical historical probability
        net_change = (0.6 * rule_adjustment) + (0.4 * prob_adjustment)
        new_rating = current_rating + net_change

        # 5. Commit change to Profile
        profile.update_rating(domain, new_rating)
        return new_rating

    def _rule_based_thresholding(self, user, domain, is_correct):
        """
        ALGORITHM 1: RULE-BASED THRESHOLDING
        Evaluates the immediate streak of the current session.
        """
        recent_logs = ResponseLog.objects.filter(user=user, domain=domain).order_by('-timestamp')[:3]
        
        if not is_correct:
            return -0.25
        
        correct_streak = 0
        for log in recent_logs:
            if log.is_correct:
                correct_streak += 1
            else:
                break
                
        if correct_streak >= 3:
            return 0.35  
        elif correct_streak == 2:
            return 0.15  
        return 0.05      

    def _probabilistic_learning_factor(self, user, domain, question_difficulty, is_correct):
        """
        ALGORITHM 2: PROBABILISTIC LEARNING (Performance Expectation)
        Uses an Elo-based logistic function to model accuracy probability.
        """
        profile = UserSkillProfile.objects.get(user=user)
        current_rating = profile.get_rating(domain)

        exponent = (question_difficulty - current_rating) / 2.0
        expected_success = 1.0 / (1.0 + math.pow(10, exponent))
        actual_success = 1.0 if is_correct else 0.0

        k_factor = 0.4
        probabilistic_shift = k_factor * (actual_success - expected_success)
        return probabilistic_shift