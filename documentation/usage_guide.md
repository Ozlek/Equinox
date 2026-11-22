# Usage Guide

## Quick Setup

### Backend
```bash
cd backend
python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit as needed
python manage.py migrate
python run_import.py
```

### Frontend
```bash
cd frontend
npm install && npm run dev
# App at http://localhost:5173
```

## Daily Workflow

### Students
1. Register/login at frontend
2. Complete onboarding (set grade 1-10)
3. Start playthrough session
4. Answer questions - DDA adjusts difficulty
5. Earn stars/achievements

### Instructors
- Use `/api/instructor/` endpoints
- Submit change requests for questions
- View/review your own change requests

### Admins
1. `python manage.py createsuperuser`
2. Access `/admin/`
3. Use `/api/admin/` endpoints
4. Review/approve change requests
5. Manage topics/questions/lessons

## Common Tasks

### Start Playthrough Session
```bash
POST /api/playthrough/start/
# Body: {"topic_id": 1, "difficulty": "intermediate"}
```

### Submit Answer (DDA adjusts automatically)
```bash
POST /api/playthrough/answer/
# Body: {"session_id": 1, "question_id": 5, "is_correct": true}
# Returns: new_rating, next_question, score_change, streak, achievement
```

### Update Grade Level
```bash
POST /api/update-grade/
# Body: {"grade_level": 7}
```

### Verify Grade Level Fix
```bash
python verify_fix.py
# Should output: ALL TESTS PASSED!
```

### Check Import Status
```bash
python verify_import.py
# Verifies question count, distribution, DDA, etc.
```

### Manage Change Requests
- Submit via `/api/instructor/questions/`
- Review via `/api/admin/change-requests/`
- Approve/reject via `/api/admin/change-request-review/<id>/`

## Production Deployment

```bash
# Backend
python manage.py collectstatic --clear
# Set DEBUG=False, proper ALLOWED_HOSTS, DATABASE_URL

# Frontend
npm run build
# Deploy dist/ directory
```

## Troubleshooting

- **CORS errors**: Check .env CORS_ALLOWED_ORIGINS
- **Grade level must be integer**: Not string "7"
- **DDA not adjusting**: Verify ResponseLog created, question.difficulty set
- **Can't connect**: Both servers running? CORS matches?