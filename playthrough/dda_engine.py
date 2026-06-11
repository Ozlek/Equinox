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
        # Look back at the last 3 responses in this domain
        recent_logs = ResponseLog.objects.filter(user=user, domain=domain).order_by('-timestamp')[:3]
        
        if not is_correct:
            # Rule: Immediate negative adjustment for a wrong answer to prevent frustration
            return -0.25
        
        # Rule: Look for consecutive success streaks to step up challenge
        correct_streak = 0
        for log in recent_logs:
            if log.is_correct:
                correct_streak += 1
            else:
                break
                
        if correct_streak >= 3:
            return 0.35  # Step up signficiantly on solid streaks
        elif correct_streak == 2:
            return 0.15  # Incremental bump
        return 0.05      # Small baseline increase for a correct hit

    def _probabilistic_learning_factor(self, user, domain, question_difficulty, is_correct):
        """
        ALGORITHM 2: PROBABILISTIC LEARNING (Performance Expectation)
        Uses an Elo-based logistic function to model accuracy probability.
        
        Equation: P(Correct) = 1 / (1 + 10^((Difficulty - Rating) / 2))
        """
        profile = UserSkillProfile.objects.get(user=user)
        current_rating = profile.get_rating(domain)

        # Expected probability that user gets this question right based on history
        exponent = (question_difficulty - current_rating) / 2.0
        expected_success = 1.0 / (1.0 + math.pow(10, exponent))

        # Actual performance representation
        actual_success = 1.0 if is_correct else 0.0

        # K-Factor defines maximum potential shift variance
        k_factor = 0.4
        
        # Adjust rating proportionally to how surprising the result was
        # (e.g., if Expected was 90% but user got it wrong, variance penalty is high)
        probabilistic_shift = k_factor * (actual_success - expected_success)
        return probabilistic_shift