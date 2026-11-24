# Contributing to Equinox

Welcome! Equinox is a Grades 1–10 math learning platform (React 19 + Vite frontend, Django 5.2.15 backend). Whether you're fixing a typo, adding a question, or changing infrastructure, start here.

## 1. Read the rules first
All code and content contributions must follow **[RULES_AND_GUIDELINES.md](./RULES_AND_GUIDELINES.md)**. It defines roles, access control, content standards, the change-request workflow, and security requirements. You do not need write access to suggest changes — open an issue or Pull Request and a maintainer will review.

## 2. Quick start

### Backend
```bash
cd backend
cp .env.example .env        # fill in SECRET_KEY, DEBUG, etc. Never commit .env
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python run_import.py        # migrations + question import
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
npm run lint                # ESLint (required before PR)
npm run build               # production build check
```

## 3. How to contribute

1. **Fork / branch** from `main`: `git checkout -b feature/your-change`
2. **Make changes** — small, focused commits preferred.
3. **Verify**:
   * Backend: `python manage.py migrate --check --dry-run`, `python verify_fix.py`, `python verify_import.py`
   * Frontend: `npm run lint && npm run build`
4. **Open a Pull Request** against `main`. A maintainer or instructor will review.
5. **Merge** after approval; delete the feature branch.

## 4. Instructor / contributor workflow (content)
* Instructors **propose** question/lesson changes via change requests (`QuestionChangeRequest`, `LessonChangeRequest`).
* Only **admins** approve and apply them — no self-approval.
* See §6 and §7 of `RULES_AND_GUIDELINES.md` for the full workflow.

## 5. Reporting security issues
See **[SECURITY.md](./SECURITY.md)**. Never disclose vulnerabilities publicly.

## 6. Getting help
* Questions: open a GitHub Discussion.
* Bugs: open an Issue with steps to reproduce.
* Urgent/security: contact the maintainer directly.

Thank you for helping keep Equinox accurate, fair, and safe for learners.
