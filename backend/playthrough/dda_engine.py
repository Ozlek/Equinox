import math
from .models import ResponseLog, UserSkillProfile


class EquinoxDDAEngine:
    """
    Dual-Algorithmic Dynamic Difficulty Adjustment (DDA) subsystem for Equinox.

    Combines two complementary algorithms to produce a continuous skill rating
    for each user/domain pair:

    1. **Rule-Based Thresholding** (Algorithm 1) — reacts to the player's
       immediate answer streak.  Provides fast, deterministic adjustments that
       keep the difficulty feeling responsive within a single session.

    2. **Probabilistic Learning Factor** (Algorithm 2) — uses an Elo-inspired
       logistic function to model the *expected* probability of success given
       the player's current rating and the question's difficulty value.  The
       difference between expected and actual outcome drives a smaller, more
       nuanced correction that accumulates over many sessions.

    The two adjustments are blended 60 / 40 (rule / probabilistic) to balance
    short-term responsiveness with long-term accuracy.

    Ratings are stored as continuous floats in ``UserSkillProfile`` and are
    bounded to ``[1.0, 4.5]`` by ``UserSkillProfile.update_rating``.  The
    discrete tier labels (Novice → Expert) are derived from these floats via
    ``get_closest_tier``.
    """

    DIFFICULTY_TIERS = {
        "Novice": 1.0,
        "Intermediate": 2.0,
        "Advanced": 3.0,
        "Expert": 4.0,
    }

    @classmethod
    def get_closest_tier(cls, numeric_rating):
        """
        Convert a continuous DDA rating to the nearest discrete difficulty tier.

        Thresholds:
            - ``< 1.8``  → ``"Novice"``
            - ``< 2.8``  → ``"Intermediate"``
            - ``< 3.8``  → ``"Advanced"``
            - ``>= 3.8`` → ``"Expert"``

        Args:
            numeric_rating (float): The player's current skill rating.

        Returns:
            str: One of ``"Novice"``, ``"Intermediate"``, ``"Advanced"``,
            ``"Expert"``.
        """
        if numeric_rating < 1.8:
            return "Novice"
        if numeric_rating < 2.8:
            return "Intermediate"
        if numeric_rating < 3.8:
            return "Advanced"
        return "Expert"

    @classmethod
    def seed_initial_rating(cls, user, domain, difficulty_str):
        """
        Seed the ``UserSkillProfile`` with the starting difficulty chosen by
        the player in the UI before a session begins.

        Converts frontend strings (e.g. ``'novice'``) to the corresponding
        numeric engine value (e.g. ``1.0``) and writes it to the profile.
        Capitalisation is normalised automatically so ``'novice'``,
        ``'Novice'``, and ``'NOVICE'`` all resolve correctly.

        Args:
            user (User): The Django ``User`` whose profile should be seeded.
            domain (str): The topic domain name (e.g. ``"Algebra"``).
            difficulty_str (str): The chosen difficulty label.  Falls back to
                ``"Intermediate"`` (2.0) if the value is not recognised.

        Returns:
            float: The numeric rating that was written to the profile.
        """
        formatted_diff = str(difficulty_str).capitalize()
        initial_numeric = cls.DIFFICULTY_TIERS.get(formatted_diff, 2.0)

        profile, _ = UserSkillProfile.objects.get_or_create(user=user)
        profile.update_rating(domain, initial_numeric)

        return initial_numeric

    def adjust_difficulty(self, user, domain, question_obj, is_correct):
        """
        Main DDA pipeline — executed on every answer submission.

        Fetches the player's current rating, logs the response, computes both
        algorithm adjustments, blends them, and commits the updated rating.

        Args:
            user (User): The player who submitted the answer.
            domain (str): The topic domain (e.g. ``"Algebra"``).
            question_obj (Question): The question that was answered.
            is_correct (bool): Whether the submitted answer was correct.

        Returns:
            float: The new (post-adjustment) skill rating for this domain.
        """
        # 1. Fetch current profile
        profile, _ = UserSkillProfile.objects.get_or_create(user=user)
        current_rating = profile.get_rating(domain)
        target_difficulty = self.DIFFICULTY_TIERS.get(question_obj.difficulty, 1.0)

        # 2. Log response for historical probability tracking
        ResponseLog.objects.create(
            user=user,
            domain=domain,
            question=question_obj,
            question_difficulty_value=target_difficulty,
            is_correct=is_correct,
        )

        # 3. Calculate adjustment via both frameworks, passing the already-fetched
        #    profile to avoid redundant DB queries.
        rule_adjustment = self._rule_based_thresholding(user, domain, is_correct)
        prob_adjustment = self._probabilistic_learning_factor(
            profile, domain, target_difficulty, is_correct
        )

        # 4. Blend: 60% rule stability + 40% empirical historical probability
        net_change = (0.6 * rule_adjustment) + (0.4 * prob_adjustment)
        new_rating = current_rating + net_change

        # 5. Commit bounded rating to profile
        profile.update_rating(domain, new_rating)
        return new_rating

    def _rule_based_thresholding(self, user, domain, is_correct):
        """
        Algorithm 1: Rule-Based Thresholding.

        Evaluates the player's recent answer streak (up to the last 3 logged
        responses) and returns a fixed adjustment value:

        - Incorrect answer → ``-0.25`` (immediate difficulty reduction)
        - Correct, no prior streak → ``+0.05`` (minimal nudge)
        - Correct, 2-answer streak → ``+0.15`` (moderate increase)
        - Correct, 3+ answer streak → ``+0.35`` (strong increase)

        The streak is computed from the *most recent* ``ResponseLog`` entries
        so it reflects cross-session history, not just the current session.

        Args:
            user (User): The player.
            domain (str): The topic domain.
            is_correct (bool): Whether the current answer was correct.

        Returns:
            float: The rule-based rating adjustment.
        """
        if not is_correct:
            return -0.25

        recent_logs = (
            ResponseLog.objects
            .filter(user=user, domain=domain)
            .order_by('-timestamp')[:3]
        )

        correct_streak = 0
        for log in recent_logs:
            if log.is_correct:
                correct_streak += 1
            else:
                break

        if correct_streak >= 3:
            return 0.35
        if correct_streak == 2:
            return 0.15
        return 0.05

    def _probabilistic_learning_factor(self, profile, domain, question_difficulty, is_correct):
        """
        Algorithm 2: Probabilistic Learning Factor (Elo-based).

        Models the *expected* probability that a player at their current rating
        answers a question of the given difficulty correctly, using a logistic
        (sigmoid) function.  The difference between the expected and actual
        outcome is scaled by a K-factor to produce the adjustment.

        Formula::

            expected = 1 / (1 + 10^((question_difficulty - current_rating) / 2))
            shift    = K * (actual - expected)   where K = 0.4

        A player who beats a hard question gains more than one who beats an
        easy one; a player who fails an easy question loses more than one who
        fails a hard one.

        Args:
            profile (UserSkillProfile): The player's already-fetched skill
                profile.  Accepting the profile as a parameter avoids an
                extra ``SELECT`` query on every answer submission.
            domain (str): The topic domain.
            question_difficulty (float): The numeric difficulty value of the
                question (from ``DIFFICULTY_TIERS``).
            is_correct (bool): Whether the submitted answer was correct.

        Returns:
            float: The probabilistic rating adjustment.
        """
        current_rating = profile.get_rating(domain)

        exponent = (question_difficulty - current_rating) / 2.0
        expected_success = 1.0 / (1.0 + math.pow(10, exponent))
        actual_success = 1.0 if is_correct else 0.0

        k_factor = 0.4
        return k_factor * (actual_success - expected_success)