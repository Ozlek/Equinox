# Equinox — Rules & Guidelines for Instructors & Contributors

> **Equinox** is a Grades 1–10 math learning platform. The frontend is React 19 + Vite; the backend is Django 5.2.15 with Django REST Framework and SimpleJWT.
>
> These rules apply to everyone who creates, edits, reviews, or maintains content and code in this repository: **instructors, admins, contributors, and maintainers.** Reading and following them is a prerequisite for access to the instructor and admin tooling.

---

## 1. Purpose & Ethical Mission

Equinox exists to help learners build math confidence through adaptive, grade-appropriate practice. Every contributor shares responsibility for keeping the platform:

*   **Accurate** — every question and solution must be correct.
*   **Fair** — no learner is advantaged or disadvantaged by contributor bias or error.
*   **Safe** — learner data is protected; no personal information is exposed.
*   **Age-appropriate** — content matches the declared grade level (1–10) and difficulty (1.0 / 2.0 / 3.0).
*   **Transparent** — every change is attributable, reviewable, and auditable.

If an action could mislead a learner, expose their data, or manipulate their progress, do not do it. Ask a maintainer first.

---

## 2. Audience & Definitions

| Term | Meaning |
|------|---------|
| **Student** | A learner who takes playthroughs, views topics, and earns stars/achievements. |
| **Instructor** | A user with `user_type = 'instructor'` who proposes question/lesson changes within an assigned scope. |
| **Admin** | A Django superuser or staff member who approves change requests, toggles verification, and manages topics/users. |
| **Contributor** | Anyone submitting code or content changes (including instructors and admins acting in that capacity). |
| **Maintainer** | Repository owner / project lead who governs this document and handles appeals. |

### Role mapping in code

*   `backend/accounts/models.py` — `UserProfile.user_type ∈ {student, instructor, admin}`; `default='student'`.
*   `backend/accounts/views.py` — `_is_admin()` returns `user.is_superuser or user.is_staff`. `_is_instructor()` returns true for admins **or** `profile.user_type == 'instructor'`.
*   Instructors are granted `is_staff = True` on registration (`register_api`), giving Django admin panel access.

---

## 3. Roles & Responsibilities Matrix

| Action | Student | Instructor | Admin | Notes |
|--------|---------|------------|-------|-------|
| Take playthroughs / view topics | ✅ | ✅ | ✅ | — |
| Complete onboarding (grade 1–10) | ✅ | ✅ | ✅ | `onboarding_api` validates `1 <= grade_level <= 10` |
| View assigned topic questions | — | ✅ (scoped) | ✅ | `_check_instructor_scope` enforces `assigned_topics` + `grade_level_min/max` |
| Propose question add/edit/delete | — | ✅ | ✅ | Creates `QuestionChangeRequest` (status=`pending`) |
| Propose lesson add/edit/delete | — | — | ✅ | `LessonChangeRequest`, admin only |
| Approve / reject change requests | — | — | ✅ | `_apply_change_request` / `_apply_lesson_change_request` |
| Toggle `is_verified` on a question | — | ✅ | ✅ | `instructor_toggle_verification` / `admin_toggle_verification` |
| Create / edit / delete topics directly | — | — | ✅ | `admin_topic_detail` |
| Create / edit / delete questions directly | — | — | ✅ | `admin_questions_list` / `admin_question_detail` (bypasses approval) |
| Manage users / view all progress | — | — | ✅ | `admin_users_list` |
| Delete own account (permanent) | ✅ | ✅ | ✅ | `delete_account_api` — irreversible |

**Core separation of duties:** Instructors **propose**; admins **approve**. No one approves their own change request.

---

## 4. Access Control & Scope Rules

### 4.1 Instructor scope enforcement
Before an instructor may view or propose changes to a question, the backend validates scope via `_check_instructor_scope()`:

1. **Topic assignment** — if `profile.assigned_topics` is non-empty, the topic ID must be in that set.
2. **Grade band** — `grade_level` must satisfy `profile.grade_level_min <= grade_level <= profile.grade_level_max`.

List endpoints filter results automatically:
*   `instructor_questions_list` filters by assigned topics and grade range.
*   `instructor_question_detail` validates the target question's topic and grade before permitting an edit/delete request.

**Rule:** Never attempt to access or modify content outside your assigned topics and grade band. Request scope changes from an admin; do not work around them.

### 4.2 Authentication & sessions
*   Backend default permission: `IsAuthenticated` (see `equinoxSite/settings.py` `REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES`).
*   Auth uses SimpleJWT: **access token lifetime = 60 minutes**, **refresh token lifetime = 7 days** (`SIMPLE_JWT`).
*   Tokens are stored in `localStorage` by the frontend (`src/api/axios.js`) and sent as `Authorization: Bearer <access>`.
*   Cookies use `SameSite=None` with `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` toggled by env (`SECURE_PROXY_SSL_HEADER` enabled for reverse proxies).

**Rule:** Treat access and refresh tokens as secrets. Never log them, never commit them, never send them to third parties.

---

## 5. Content Contribution Standards

### 5.1 Question standards (`Question` model)
All contributed questions must satisfy:

| Field | Requirement |
|-------|-------------|
| `question_text` | Clear, unambiguous, grade-appropriate wording. |
| `question_solution` | Full step-by-step solution, not just the final answer. |
| `correct_answer` | Must exactly match the solution's final answer. |
| `choice_a` – `choice_d` | All four choices provided for multiple-choice; distractors must be plausible but clearly incorrect. |
| `grade_level` | Integer between **1 and 10** inclusive; must fall within the topic's `grade_level_min`–`grade_level_max`. |
| `difficulty` | `1.0` (Novice), `2.0` (Intermediate), or `3.0` (Advanced). |
| `source` | `'seed'`, `'train'`, or other tracked source; do not fabricate. |
| `is_word_problem` | Boolean; set `true` for word problems. |
| `is_verified` | `false` by default on instructor-submitted additions; set only after review (see §7). |

**Rule:** `correct_answer` and `question_solution` must agree. A question whose solution contradicts its answer is rejected.

### 5.2 Topic standards (`Topic` model)
Valid topic names are constrained by `TOPIC_CHOICES`:
Arithmetic; Number Sense and Place Value; Fractions, Decimals, and Percentages; Ratios and Proportional Reasoning; Algebra and Algebraic Expressions; Functions and Graphing; Geometry and Spatial Reasoning; Exponents, Powers, and Scientific Notation; Polynomials; Trigonometry; Statistics and Data Analysis.

Topics have `grade_level_min` / `grade_level_max` (default 1–10) and an `is_visible` flag controlling appearance in the Topic Catalogue.

**Rule:** Do not invent topic names outside `TOPIC_CHOICES`. Respect `is_visible` — hidden topics are not for learner-facing use.

### 5.3 Lesson standards (`Lesson` model)
Lessons belong to a topic and include `title`, `grade_level`, `order`, `objectives`, `example`, and `tip`. Objectives must be a list.

### 5.4 Language & bias
*   Use inclusive, bias-free language (no gender, ethnic, ability, or socioeconomic stereotypes).
*   Word problems must use diverse names and contexts; avoid culturally specific references that Grades 1–10 learners may not understand.
*   Cite sources for imported or adapted questions (populate the `source` field and keep import records).

### 5.5 Grade & difficulty calibration
*   Grade levels span 1–10 (`onboarding_api` and `update_grade_api` both enforce `1 <= grade_level <= 10`).
*   Difficulty must match cognitive demand: 1.0 = direct recall/procedure, 2.0 = multi-step, 3.0 = non-routine application.
*   The DDA engine (`playthrough/dda_engine.py`) adjusts learner domain ratings based on correctness; contributors must not craft questions to game this engine.

---

## 6. Change Request Workflow

Equinox uses a **review-before-publish** model for instructor contributions.

### 6.1 Submission (instructor)
*   `POST /accounts/instructor/questions/` creates a `QuestionChangeRequest` with `change_type ∈ {add, edit, delete}`.
*   The request stores `proposed_data`, `submitted_by`, and `status = 'pending'`.
*   Direct creation (`POST /accounts/admin/questions/`) bypasses approval and is **admin only**.

### 6.2 Review (admin)
*   Admins list pending requests via `admin_change_requests_list` / `admin_lesson_change_requests_list`.
*   Review via `admin_change_request_review` / `admin_lesson_change_request_review` with `action ∈ {approve, reject}` and `review_notes`.
*   On approve, `_apply_change_request` / `_apply_lesson_change_request` mutates the `Question` / `Lesson` table and links the request.
*   The request record keeps `reviewed_by`, `reviewed_at`, and `review_notes` for audit.

### 6.3 Instructor self-service
*   `instructor_my_change_requests` lists a user's own requests.
*   `instructor_toggle_verification` lets instructors/admins flip `Question.is_verified` (audited by the model timestamp, not the change-request table).

**Rules:**
1. **No self-approval.** An admin must not approve a change request they submitted.
2. **Scope applies to proposals.** Instructors may only propose changes within their assigned topics and grade band.
3. **Documentation required.** Every rejection must include `review_notes` explaining why.
4. **No bypass.** Do not edit the database directly to circumvent the change-request system.


---

## 7. Question Verification (`is_verified`)

`Question.is_verified` indicates a question has passed a quality review.

*   Instructors and admins may toggle it via `instructor_toggle_verification` / `admin_toggle_verification`.
*   Admin-created questions default to `is_verified = False` unless explicitly set.
*   Instructor-submitted (approved) questions default to `is_verified = False` (`_apply_change_request` sets it false on add).

**Rule:** Verification means the question text, solution, answer, choices, grade level, and difficulty have been checked for correctness and age-appropriateness. It is **not** a pedagogical endorsement. Unverified questions remain usable but are flagged for review.

---

## 8. Data Privacy & Learner Protection

### 8.1 Learner data collected
*   `UserProfile`: grade level, onboarding status, user type, assigned topics, grade band.
*   `UserStars`: star balance (premium currency).
*   `ResponseLog`, `PlaythroughSession`, `DomainRating`: answers, session scores, adaptive ratings.
*   `UnlockedAchievement`: achievement progress.

### 8.2 Rules
*   **Minimize collection.** Do not add fields that identify a learner beyond what the model requires.
*   **No PII in logs.** Never write usernames, emails, or answers to plain-text application logs in production. Logging is configured in `equinoxSite/settings.py` (`LOGGING`); keep it at `WARNING`+ for Django internals in production.
*   **Account deletion is permanent.** `delete_account_api` deletes the `User` row (cascading to profile, stars, progress, etc.). Warn users before enabling this flow.
*   **Grade validation.** Onboarding and grade updates accept only integers 1–10 (`onboarding_api`, `update_grade_api`). Do not accept or store out-of-range values.
*   **Cross-user access.** Users may only read/modify their own progress unless they hold admin privileges (`admin_users_list` is admin-only).


---

## 9. Security Rules

### 9.1 Secrets & environment
*   `backend/.env` contains `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `DATABASE_URL`.
*   **Never commit `.env`.** The repo `.gitignore` covers frontend `*.local` but you must also keep backend `.env` out of version control. Copy `backend/.env.example` → `backend/.env` locally and fill in real values.
*   `SECRET_KEY` must be a strong random value (`python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`).
*   **`DEBUG = False` in production.** `DEBUG=True` leaks stack traces and environment details.
*   `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` must list only trusted origins. Defaults allow `localhost:5173` and Railway production URLs.
*   `CSRF_TRUSTED_ORIGINS` must match the frontend origin when using cookie-based CSRF.

### 9.2 Token handling
*   Access tokens live 60 minutes; refresh tokens 7 days.
*   Frontend `src/api/axios.js` auto-refreshes on `401` using the refresh token stored in `localStorage`; on refresh failure it clears tokens and redirects to `/`.
*   **Rule:** Do not extend token lifetimes without a security review. Do not store tokens in plain text anywhere other than the intended `localStorage` mechanism.

### 9.3 Production hardening
*   Set `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True` behind HTTPS.
*   Use `whitenoise` for static files (already in `MIDDLEWARE` and `STORAGES`).
*   Enable PostgreSQL connection pooling in production via `django-db-connection-pool` (conditional in `settings.py`).
*   Rotate `SECRET_KEY` and refresh tokens immediately if compromise is suspected.

### 9.4 Vulnerability reporting
Report security issues privately to the maintainer (see `SECURITY.md`). Do not open public issues for vulnerabilities.

---

## 10. Professional Conduct

1. **Stay in scope.** Use only the topics and grade levels assigned to you.
2. **No privilege escalation.** Do not attempt to access admin-only endpoints or impersonate another user.
3. **No DDA manipulation.** Do not create questions, sessions, or responses designed to artificially inflate domain ratings or bypass `EquinoxDDAEngine` logic.
4. **Constructive reviews.** Review change requests promptly, with specific, learner-focused feedback in `review_notes`.
5. **Learner first.** If a change could confuse or discourage a learner, escalate to a maintainer before approving.
6. **Respect confidentiality.** Learner progress data is not for sharing outside the platform.


---

## 11. Developer Contribution Workflow

### 11.1 Git workflow
1. Create a feature branch from `main`: `git checkout -b feature/your-change`.
2. Make small, focused commits with clear messages.
3. Open a Pull Request against `main`.
4. At least one maintainer/instructor review is required before merge.
5. Delete the feature branch after merge.

### 11.2 Frontend (`frontend/`)
*   Stack: React 19, React DOM, Vite, ESLint (`@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`), Axios.
*   Scripts (`package.json`): `dev`, `build`, `lint`, `preview`.
*   **Before every PR:** run `npm run lint` and fix errors; run `npm run build` to confirm production compilation.
*   ESLint config is flat-config (`eslint.config.js`) targeting `**/*.{js,jsx}`; ignores `dist`.
*   API base: `http://127.0.0.1:8000` locally; Railway backend in production (`src/api/axios.js`).
*   Do not commit `node_modules/` or `dist/` (`.gitignore`).

### 11.3 Backend (`backend/`)
*   Stack: Django 5.2.15, DRF 3.14.0, SimpleJWT 5.5.1, dj-rest-auth, django-cors-headers, drf-spectacular, Gunicorn, Whitenoise.
*   Setup: copy `.env.example` to `.env`; `python -m venv venv`; `pip install -r requirements.txt`.
*   Commands: `python manage.py migrate`, `python manage.py runserver`.
*   Data import: `python run_import.py` runs migrations then `import_all_questions`.
*   Verification: `python verify_fix.py` and `python verify_import.py` validate data and engine behavior before release.
*   New models/migrations: run `python manage.py makemigrations` then `python manage.py migrate`; include migrations in your PR.
*   Do not commit `venv/`, `__pycache__/`, `*.pyc`, or `db.sqlite3`.

### 11.4 Testing checklist before merge
| Check | Command |
|-------|---------|
| Frontend lint | `cd frontend && npm run lint` |
| Frontend build | `cd frontend && npm run build` |
| Backend migrations | `cd backend && python manage.py migrate --check --dry-run` |
| Import verification | `cd backend && python verify_import.py` |
| Grade-level fix | `cd backend && python verify_fix.py` |

---

## 12. Enforcement & Violations

| Severity | Example | Consequence |
|----------|---------|-------------|
| Minor | Missing `review_notes`; minor style violation | Verbal warning; request returned for correction |
| Moderate | Accessing out-of-scope topic; skipping change-request review | Temporary suspension of contributor/instructor privileges |
| Severe | Fabricating answers; manipulating DDA/grades; exposing learner PII; committing `.env` with real secrets | Immediate privilege revocation; possible removal from project |

Appeals go to the maintainer. All enforcement actions are documented in the repository's governance log.

---

## Appendix A — Permission & Endpoint Quick Reference

| Endpoint | Method | Permission | Role |
|----------|--------|------------|------|
| `/api/token/` | POST | AllowAny | All |
| `/api/token/refresh/` | POST | AllowAny | All |
| `/accounts/login/` | POST | AllowAny | All |
| `/accounts/register/` | POST | AllowAny | All |
| `/accounts/onboarding/` | POST | AllowAny | Student (grade 1–10) |
| `/accounts/check-auth-status/` | GET | AllowAny | All |
| `/accounts/logout/` | POST | IsAuthenticated | All |
| `/accounts/admin/users/` | GET | IsAuthenticated + `_require_admin` | Admin |
| `/accounts/admin/topics/` | GET | IsAuthenticated + `_require_admin` | Admin |
| `/accounts/admin/questions/` | GET/POST | IsAuthenticated + `_require_admin` | Admin |
| `/accounts/instructor/questions/` | GET/POST | IsAuthenticated + `_require_instructor` | Instructor |
| `/accounts/admin/change-requests/` | GET | IsAuthenticated + `_require_admin` | Admin |
| `/accounts/admin/change-requests/{id}/review/` | POST | IsAuthenticated + `_require_admin` | Admin |
| `/playthrough/{topic_id}/` | GET/POST | IsAuthenticated | Authenticated |
| `/playthrough/learning-resources/{topic_id}/` | GET | AllowAny | All |

> Scope helpers: `_is_admin`, `_is_instructor`, `_require_admin`, `_require_instructor`, `_check_instructor_scope` are defined in `backend/accounts/views.py`.

---

*Document version: 1.0  
Maintained by: Equinox project maintainers  
Questions: open a discussion in the repository or contact the maintainer directly.*

