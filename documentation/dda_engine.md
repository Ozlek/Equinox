# DDA Engine Documentation

## Overview
Equinox uses a Dual-Algorithmic Dynamic Difficulty Adjustment (DDA) system that blends two algorithms:
- **60% Rule-based**: Immediate streak-based adjustments
- **40% Probabilistic**: Elo-inspired long-term learning

**Rating range**: [1.0, 4.5], mapped to tiers: Novice < Intermediate < Advanced < Expert

## Rule-Based Thresholding (Algorithm 1)

- Uses last 3 ResponseLog entries
- Incorrect → -0.25
- Correct streak 1 → +0.05
- Correct streak 2 → +0.15  
- Correct streak 3+ → +0.35

## Probabilistic Learning Factor (Algorithm 2)

Elo-inspired logistic function:
```
expected = 1 / (1 + 10^((question_difficulty - current_rating) / 2))
shift = K * (actual - expected)  where K = 0.4
```

## Rating System

- **Bounds**: [1.0, 4.5] enforced on every update
- **Tiers**: <1.8 → Novice, <2.8 → Intermediate, <3.8 → Advanced, >=3.8 → Expert
- **Seed initial rating**: Based on frontend difficulty choice (novice=1.0, intermediate=2.0, advanced=3.0, expert=4.0)

## Adjustment Pipeline

1. Fetch current rating
2. Log response to ResponseLog
3. Calculate both adjustments
4. Net change = 0.6 * rule + 0.4 * probabilistic
5. New rating = current + net change, bounded to [1.0, 4.5]