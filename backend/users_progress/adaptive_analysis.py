"""
Adaptive analysis engine - separate module to avoid circular imports.
"""
from collections import defaultdict
from playthrough.dda_engine import EquinoxDDAEngine
from playthrough.models import Question, DomainRating, ResponseLog
from topics.models import Topic
from .models import UserProgress


def generate_adaptive_analysis(user):
    """
    Core logic for adaptive analysis - can be called from views or other code.
    
    Args:
        user: Django User instance
        
    Returns:
        dict: Analysis data with 'analysis' and 'recommendations' keys
    """
    dda = EquinoxDDAEngine()
    
    # Get all domain ratings for the user
    domain_ratings = DomainRating.objects.filter(user=user)
    current_ratings = {dr.domain_name: dr.rating for dr in domain_ratings}

    # Get all response logs for the user (last 100 responses for performance)
    recent_logs = ResponseLog.objects.filter(user=user).order_by('-timestamp')[:100]

    # Group logs by domain
    domain_performance = defaultdict(lambda: {
        'total': 0,
        'correct': 0,
        'recent_correct': 0,
        'recent_total': 0,
        'word_problem_correct': 0,
        'word_problem_total': 0,
        'direct_problem_correct': 0,
        'direct_problem_total': 0,
        'difficulties_attempted': [],
        'timestamps': []
    })

    for log in recent_logs:
        domain = log.domain
        perf = domain_performance[domain]

        perf['total'] += 1
        perf['difficulties_attempted'].append(log.question_difficulty_value)
        perf['timestamps'].append(log.timestamp)

        if log.is_correct:
            perf['correct'] += 1

        # Track recent performance (last 20 responses per domain)
        if len(perf['timestamps']) <= 20:
            perf['recent_total'] += 1
            if log.is_correct:
                perf['recent_correct'] += 1

        # Track word problem vs direct problem performance
        try:
            question = log.question
            if question.is_word_problem:
                perf['word_problem_total'] += 1
                if log.is_correct:
                    perf['word_problem_correct'] += 1
            else:
                perf['direct_problem_total'] += 1
                if log.is_correct:
                    perf['direct_problem_correct'] += 1
        except Question.DoesNotExist:
            pass

    # Calculate metrics and generate recommendations
    analysis = {
        'overall_accuracy': 0.0,
        'domains': {},
        'strengths': [],
        'weaknesses': [],
        'learning_velocity': 'stable'
    }

    domain_scores = []

    for domain, perf in domain_performance.items():
        accuracy = (perf['correct'] / perf['total'] * 100) if perf['total'] > 0 else 0
        recent_accuracy = (perf['recent_correct'] / perf['recent_total'] * 100) if perf['recent_total'] > 0 else 0

        word_problem_accuracy = (perf['word_problem_correct'] / perf['word_problem_total'] * 100) if perf['word_problem_total'] > 0 else 0
        direct_problem_accuracy = (perf['direct_problem_correct'] / perf['direct_problem_total'] * 100) if perf['direct_problem_total'] > 0 else 0

        current_rating = current_ratings.get(domain, 1.0)
        current_tier = EquinoxDDAEngine.get_closest_tier(current_rating)

        # Calculate learning velocity (improvement trend)
        if len(perf['timestamps']) >= 10:
            # Compare first half vs second half accuracy
            mid = len(perf['timestamps']) // 2
            first_half_correct = sum(1 for i in range(mid) if perf['timestamps'][i] < perf['timestamps'][mid])
            # This is simplified - in reality we'd need to track correctness over time
            if recent_accuracy > accuracy + 10:
                velocity = 'improving'
            elif recent_accuracy < accuracy - 10:
                velocity = 'declining'
            else:
                velocity = 'stable'
        else:
            velocity = 'insufficient_data'

        domain_scores.append({
            'domain': domain,
            'accuracy': round(accuracy, 1),
            'recent_accuracy': round(recent_accuracy, 1),
            'current_rating': current_rating,
            'current_tier': current_tier,
            'word_problem_accuracy': round(word_problem_accuracy, 1),
            'direct_problem_accuracy': round(direct_problem_accuracy, 1),
            'velocity': velocity,
            'total_attempts': perf['total']
        })

        analysis['domains'][domain] = {
            'accuracy': round(accuracy, 1),
            'recent_accuracy': round(recent_accuracy, 1),
            'current_tier': current_tier,
            'word_problem_accuracy': round(word_problem_accuracy, 1),
            'direct_problem_accuracy': round(direct_problem_accuracy, 1),
            'velocity': velocity,
            'total_attempts': perf['total']
        }

    # Calculate overall accuracy
    if domain_scores:
        overall_acc = sum(d['accuracy'] for d in domain_scores) / len(domain_scores)
        analysis['overall_accuracy'] = round(overall_acc, 1)

    # Identify strengths and weaknesses
    domain_scores_sorted = sorted(domain_scores, key=lambda x: x['recent_accuracy'], reverse=True)

    if domain_scores_sorted:
        analysis['strengths'] = [d['domain'] for d in domain_scores_sorted[:2] if d['recent_accuracy'] >= 70]
        analysis['weaknesses'] = [d['domain'] for d in domain_scores_sorted[-2:] if d['recent_accuracy'] < 60]

    # Generate recommendations
    recommendations = []

    # 1. Recommend next topic based on weaknesses
    if analysis['weaknesses']:
        weakest_domain = analysis['weaknesses'][0]
        # Get data from domain_scores which has recent_accuracy
        weakest_data = next((d for d in domain_scores if d['domain'] == weakest_domain), None)
        current_rating = current_ratings.get(weakest_domain, 1.0)

        if weakest_data:
            # Suggest appropriate difficulty based on recent accuracy
            if weakest_data['recent_accuracy'] < 40:
                suggested_difficulty = 'Novice'
                reason = f"Your recent accuracy in {weakest_domain} is below 40%. Let's strengthen fundamentals."
            elif weakest_data['recent_accuracy'] < 60:
                suggested_difficulty = 'Intermediate'
                reason = f"You're making progress in {weakest_domain}. Continue at intermediate level to build confidence."
            else:
                suggested_difficulty = weakest_data['current_tier']
                reason = f"You're doing well in {weakest_domain}! Challenge yourself further."
        else:
            # Fallback if no data available
            suggested_difficulty = EquinoxDDAEngine.get_closest_tier(current_rating)
            reason = f"Continue practicing {weakest_domain} to improve your skills."

        recommendations.append({
            'type': 'improvement',
            'priority': 'high',
            'topic': weakest_domain,
            'difficulty': suggested_difficulty,
            'reason': reason,
            'expected_benefit': f"Improve {weakest_domain} skills and increase overall mastery"
        })

    # 2. Recommend advancing strong domains
    for domain_data in domain_scores_sorted[:2]:
        if domain_data['recent_accuracy'] >= 80 and domain_data['current_tier'] != 'Expert':
            current_tier = domain_data['current_tier']
            next_tier = {
                'Novice': 'Intermediate',
                'Intermediate': 'Advanced',
                'Advanced': 'Expert'
            }.get(current_tier)

            if next_tier:
                recommendations.append({
                    'type': 'advancement',
                    'priority': 'medium',
                    'topic': domain_data['domain'],
                    'difficulty': next_tier,
                    'reason': f"Excellent performance in {domain_data['domain']}! You're ready for {next_tier} challenges.",
                    'expected_benefit': f"Advance to {next_tier} level in {domain_data['domain']}"
                })

    # 3. Recommend focusing on word problems if struggling
    for domain_data in domain_scores:
        if domain_data.get('word_problem_accuracy', 0) < 50 and domain_data.get('word_problem_total', 0) >= 5:
            recommendations.append({
                'type': 'skill_focus',
                'priority': 'low',
                'topic': domain_data['domain'],
                'difficulty': domain_data['current_tier'],
                'reason': f"Practice more word problems in {domain_data['domain']} to improve problem-solving skills.",
                'expected_benefit': "Better real-world application of math concepts"
            })

    # 4. If no specific recommendations, suggest balanced practice
    if not recommendations:
        # Find domain with most attempts but room for improvement
        most_practiced = max(domain_scores, key=lambda x: x['total_attempts']) if domain_scores else None
        if most_practiced and most_practiced['total_attempts'] > 0:
            recommendations.append({
                'type': 'maintenance',
                'priority': 'low',
                'topic': most_practiced['domain'],
                'difficulty': most_practiced['current_tier'],
                'reason': "Continue practicing to maintain your current skill level.",
                'expected_benefit': "Maintain and reinforce existing knowledge"
            })

    return {
        'analysis': analysis,
        'recommendations': recommendations[:3]  # Return top 3 recommendations
    }