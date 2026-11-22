# Question Import System Documentation

## Commands

### `run_import.py`
```bash
cd backend && python run_import.py
```
- Applies migrations
- Runs `import_all_questions` command

### `import_all_questions.py`
```bash
python manage.py import_all_questions [--skip-train] [--skip-test] [--skip-seed] [--seed-count N]
```
- Imports from 3 sources: train.jsonl, test.jsonl, procedural seed generation

## JSONL Import Format

**One JSON object per line** expected fields:
- `topic`: string (e.g., "Arithmetic")
- `question`: string (question text)
- `answer`: string (final answer)
- `difficulty`: string ("Novice"/"Intermediate"/"Advanced"/"Expert") or float
- `grade_level`: string ("Elementary"/"Grade 4"/.../"Grade 10") or integer 1-10
- `choices[]`: optional, for MCQ (4 options)
- `correct_letter`: optional, "A"-"D"

## Grade Level Parsing

Strings mapped to integers:
- Elementary → 4, Grade 4 → 4, Grade 5 → 5, Grade 6 → 6
- Junior High → 7, Grade 7 → 7, Grade 8 → 8, Grade 9 → 9, Grade 10 → 10
- Unrecognized → defaults to 7

## Difficulty Parsing

- Novice → 1.0, Intermediate → 2.0, Advanced → 3.0, Expert → 4.0
- Unrecognized string → 1.0

## Seed Question Generation

- Uses `EquinoxQuestionGenerator` (50 templates across 5 domains)
- 200 questions per domain × 5 domains = 1000 total
- Auto-verified (is_verified=True)
- 50/50 MCQ vs text-box split
- All templates registered in QuestionTemplate table

## Source Counts (typical)

| Source | Questions | is_word_problem |
|--------|-----------|-----------------|
| train.jsonl | ~1500 | True |
| test.jsonl | ~1500 | True |
| seed (procedural) | 1000 | False |
| **TOTAL** | **~4000** | |

## Troubleshooting

- grade_level must be integer, NOT string (verified by verify_fix.py)
- Ensure train.jsonl and test.jsonl exist in backend/
- JSONL must have one valid JSON object per line