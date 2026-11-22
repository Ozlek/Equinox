# Configuration Documentation

## Environment Variables (.env)

### Backend .env
```
DEBUG=True
SECRET_KEY=$9x=z+az44uoufc#wkp^=uw%)v#^np4u4nfuk=&eqb+!9n*hf&
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Backend .env.example
See .env.example in backend/ for full list with descriptions.

### Key Variables
- `DEBUG`: True for development, False for production
- `SECRET_KEY`: Django secret key (required)
- `ALLOWED_HOSTS`: Comma-separated hostnames
- `CORS_ALLOWED_ORIGINS`: Frontend URL(s) for CORS
- `CSRF_TRUSTED_ORIGINS`: CSRF trusted origins
- `DATABASE_URL`: PostgreSQL connection string (optional, defaults to SQLite)

## CORS & CSRF

### CORS Settings
- `CORS_ALLOWED_ORIGINS`: http://localhost:5173, http://127.0.0.1:5173
- `CORS_ALLOW_CREDENTIALS`: True

### CSRF Settings
- `CSRF_TRUSTED_ORIGINS`: Matches CORS origins
- `SESSION_COOKIE_SECURE`: False (dev), True (prod)
- `CSRF_COOKIE_SECURE`: False (dev), True (prod)

## Playthrough Configuration

```python
PLAYTHROUGH_CONFIG = {
    'MAX_QUESTIONS_PER_SESSION': 10,
}
```

## Database

### SQLite (default)
- `db.sqlite3` in project root

### PostgreSQL (production)
- Set `DATABASE_URL` env var
- Format: `postgres://user:password@host:port/dbname`

### Connection Pooling
- Enabled via `django-db-connection-pool` when not DEBUG

## Static Files

- `STATIC_URL = 'static/'`
- `STATIC_ROOT = BASE_DIR / 'staticfiles'`
- `STATICFILES_DIRS = [BASE_DIR / "static"]`
- WhiteNoise middleware for production serving

## JWT Authentication

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

## Topics

### Grade Levels
- `grade_level_min`: 1-10, default=1
- `grade_level_max`: 1-10, default=10
- 1-6: Elementary, 7-10: Junior High

### Visibility
- `is_visible`: Controls topic catalogue visibility

## Sources

- `'train'`: Training data
- `'test'`: Test data  
- `'seed'`: Procedurally generated (default)

## Achievements

- Registry in `users_progress/achievements.py`
- `BADGES` dict: title, description, icon per badge
- Stars awarded per achievement