# Backend Architecture Documentation

## Django Project Structure

### Project Overview
Equinox backend is a Django 5.2.15 project named `equinoxSite` with the following structure:

```
equinoxSite/
├── __init__.py        # Package marker
├── asgi.py            # ASGI configuration
├── settings.py        # Project settings (loads .env)
├── urls.py            # URL routing
└── wsgi.py            # WSGI configuration
```

### Installed Applications
The project includes these Django apps:

| App | Purpose |
|-----|---------|
| `admin` | Django admin interface |
| `auth` | Authentication system |
| `contenttypes` | Content type framework |
| `sessions` | Session framework |
| `messages` | Message framework |
| `staticfiles` | Static file serving |
| `rest_framework` | Django REST Framework |
| `rest_framework_simplejwt` | JWT authentication |
| `rest_framework.authtoken` | Token authentication |
| `corsheaders` | CORS headers support |
| `drf_spectacular` | OpenAPI schema generation |
| `accounts` | User registration, profiles, onboarding |
| `pages` | Static page views |
| `dashboard` | Dashboard functionality |
| `topics` | Topics, lessons, and question templates |
| `playthrough` | DDA engine, questions, sessions |
| `users_progress` | User progress, achievements, adaptive analysis |

### Core Settings (`settings.py`)

#### Environment Configuration
- Loads `.env` file via `django-environ` / `python-dotenv`
- `SECRET_KEY`: From env, defaults to development key
- `DEBUG`: From env (True/False)
- `ALLOWED_HOSTS`: Comma-separated list
- `CORS_ALLOWED_ORIGINS`: `http://localhost:5173,http://127.0.0.1:5173`
- `CSRF_TRUSTED_ORIGINS`: Same as CORS origins

#### Database
- Default: SQLite (`db.sqlite3`)
- Production: PostgreSQL via `dj_database_url`
- Connection pooling available with `django-db-connection-pool`

#### JWT Authentication
- Access token: 60 minutes lifetime
- Refresh token: 7 days lifetime
- Header: `Bearer`

#### CORS & CSRF
- `CORS_ALLOW_CREDENTIALS = True`
- `CSRF_TRUSTED_ORIGINS`: Matches frontend URL
- `SESSION_COOKIE_SECURE`: False (dev), True (prod)
- `CSRF_COOKIE_SECURE`: False (dev), True (prod)

#### Playthrough Configuration
```python
PLAYTHROUGH_CONFIG = {
    'MAX_QUESTIONS_PER_SESSION': 10,
}
```

#### Static Files
- `WhiteNoise` for serving static files in production
- `STATIC_URL = 'static/'`
- `STATIC_ROOT = BASE_DIR / 'staticfiles'`
- `STATICFILES_DIRS = [BASE_DIR / "static"]`

## API Authentication

### JWT Token Flow
1. `POST /api/login/` - Returns access and refresh tokens
2. `POST /api/token/refresh/` - Refresh access token using refresh token
3. `Authorization: Bearer <access_token>` header for protected endpoints

### Session Authentication
- Traditional Django session-based auth also supported
- Used for browser-based interactions

## URL Patterns (`urls.py`)

### Main Endpoints
```
''          -> pages app
'admin/'    -> Django admin
'api/token/' -> JWT token obtain
'api/token/refresh/' -> JWT token refresh
'accounts/' -> accounts app (auth, onboarding, profile)
'dashboard/' -> dashboard app
'topics/'    -> topics app (topics, lessons)
'playthrough/' -> playthrough app (questions, sessions)
'progress/'  -> users_progress app (progress, achievements)

### API Docs
'api/schema/' -> OpenAPI schema
'api/docs/'   -> Swagger UI
'api/redoc/'  -> ReDoc (if available)
```

## Model Relationships

### Key Relationships
- `Question` → `Topic` (ForeignKey): Each question belongs to a topic
- `Question` → `User` (via ResponseLog): Response logs track user answers
- `PlaythroughSession` → `User` and `Topic`: Tracks active quiz sessions
- `Lesson` → `Topic`: Lessons are organized within topics
- `DomainRating` → `User` and `domain_name`: Per-user per-domain skill ratings
- `UserProgress` → `User` and `Topic`: User progress tracking per topic
- `UnlockedAchievement` → `User`: User achievements

### Grade Level System
- Integer values 1-10
- 1-6: Elementary school
- 7-10: Junior high school
- Each `Topic` has `grade_level_min` and `grade_level_max` fields
- Questions have `grade_level` field (must be integer, not string!)

### Difficulty System
- Float values: 1.0 (Novice), 2.0 (Intermediate), 3.0 (Advanced), 4.0 (Expert)
- Stored in `Question.difficulty`
- Used by DDA engine to determine next question difficulty