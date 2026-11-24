# Security Policy

## Supported versions
Security updates are provided for the `main` branch only. Older branches are not patched.

## Reporting a vulnerability
**Do not open a public GitHub issue for security vulnerabilities.**

Email the maintainer privately with:
* A description of the issue and affected component (frontend, backend, API, auth).
* Steps to reproduce, including any sample payloads.
* The potential impact (e.g., data exposure, privilege escalation, token theft).
* Suggested remediation, if you have one.

You will receive an acknowledgment within 5 business days and regular status updates until resolution.

## Security basics for contributors
Read §9 of **[RULES_AND_GUIDELINES.md](./RULES_AND_GUIDELINES.md)** in full. Key points:

| Area | Rule |
|------|------|
| `.env` | Never commit it. Copy `.env.example` and fill locally. Rotate `SECRET_KEY` if leaked. |
| `DEBUG` | Must be `False` in production. |
| Secrets | `SECRET_KEY`, database URLs, and tokens are secrets — never log or share them. |
| JWT | Access = 60 min, refresh = 7 days. Do not extend without review. Tokens live in `localStorage` (`frontend/src/api/axios.js`). |
| CORS / CSRF | `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` must list only trusted origins. |
| Cookies | `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` = `True` behind HTTPS in production; `SameSite=None` is set in `settings.py`. |
| Learner data | No PII in logs. Account deletion is permanent. |

## Production hardening checklist
Before deploying, confirm:
1. `DEBUG=False`
2. `SECRET_KEY` is a strong, unique random value
3. `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True`
4. `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` contain only production domains
5. `SECURE_PROXY_SSL_HEADER` is configured if behind a TLS-terminating proxy (already set in `settings.py`)
6. `whitenoise` static-file storage is active (already in `MIDDLEWARE` + `STORAGES`)
7. Dependencies are up to date (`pip install -r requirements.txt`, `npm install`)

## Disclosure policy
Verified reports will be fixed in `main` and credited (unless you request anonymity). Public disclosure is coordinated with the reporter.
