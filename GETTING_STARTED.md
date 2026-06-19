# Getting Started with Equinox Improvements in VS Code

## Quick Setup (5 minutes)

### 1. Pull Latest Changes
```bash
# In main worktree
cd ~/Repository/Python/Equinox
git pull origin main

# Or in VS Code Terminal
Ctrl+` to open terminal
git pull origin main
```

### 2. Install Dependencies
```bash
# Install new packages (drf-spectacular, python-dotenv)
pip install -r requirements.txt

# Or if using venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### 3. Create/Verify `.env` File
The `.env` file contains all sensitive config. **Must exist at project root:**

```bash
# Navigate to project root
cd ~/Repository/Python/Equinox

# Verify .env exists
cat .env  # Linux/Mac
type .env # Windows
```

**Expected .env contents:**
```
DEBUG=False
SECRET_KEY=django-insecure-your-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

> **Important**: `.env` is in `.gitignore` — never commit it! Keep your actual secrets safe.

---

## Using Each Improvement in VS Code

### 🔒 Secret Key Management

**What changed**: All secrets moved from `settings.py` to `.env`

**How to use**:
1. Edit `.env` with your environment-specific values
2. No need to touch `settings.py` — it now loads from `.env` automatically
3. Development vs Production:
   ```
   # .env for development
   DEBUG=True
   SECRET_KEY=django-insecure-dev-key

   # .env for production
   DEBUG=False
   SECRET_KEY=your-strong-production-key
   ```

**Location**: `equinoxSite/settings.py` lines 13-18, 28-33

---

### ✅ Running Unit Tests

**What changed**: 39 comprehensive tests added (33 core + 6 auth)

**How to run in VS Code**:

**Option 1: Terminal (quickest)**
```bash
# Run all tests
python manage.py test

# Run specific test class
python manage.py test playthrough.tests.DDAEngineInitializationTests

# Run with verbose output
python manage.py test --verbosity=2

# Run only playthrough tests (33 tests)
python manage.py test playthrough.tests

# Run only auth tests (6 tests)
python manage.py test accounts.tests
```

**Option 2: VS Code Test Explorer**
1. Install **Python** extension (if not already)
2. Install **Django** extension
3. Command palette: `Ctrl+Shift+P` → "Test: Run All Tests"
4. Tests auto-discover from `playthrough/tests.py` and `accounts/tests.py`

**Test Files**:
- `playthrough/tests.py` — DDA engine, difficulty, gamification (33 tests)
- `accounts/tests.py` — Authentication, profiles (6 tests)

**Expected Output**:
```
Ran 39 tests in 26.634s
OK
```

---

### 📚 Swagger API Documentation

**What changed**: Auto-generated interactive API docs now available

**How to access in VS Code**:

1. **Start development server**:
   ```bash
   python manage.py runserver
   ```

2. **Open in browser**:
   - Swagger UI (interactive): `http://localhost:8000/api/docs/`
   - OpenAPI schema (JSON): `http://localhost:8000/api/schema/`
   - ReDoc (alternative): `http://localhost:8000/api/redoc/`

3. **In VS Code**:
   - Use REST Client extension: `Ctrl+Shift+P` → "Rest Client: Add Request"
   - Or use Thunder Client extension (built-in)
   - Paste URLs above and test endpoints

**Key Endpoints Documented**:
- `/api/schema/` — Machine-readable OpenAPI spec
- `/api/docs/` — Interactive Swagger UI with "Try it out" button
- `/playthrough/<topic_id>/` — Playthrough API (GET/POST)
- `/accounts/login/` — Login endpoint

**Docstrings Added**:
- `playthrough/views.py` lines 22-61 — Playthrough API documentation
- `accounts/views.py` — Login API documentation

> Docstrings are automatically parsed by `drf-spectacular` and displayed in Swagger UI.

---

### 🏗️ Polymorphic Question Models

**What changed**: Reference implementation created for extensible Question architecture

**How to use**:

**View the design**:
```bash
# Read the design document
cat QUESTION_MODEL_REFACTORING.md

# View implementation
cat playthrough/polymorphic_models.py
```

**When ready to adopt** (future, not now):

1. Add to `playthrough/models.py`:
   ```python
   from .polymorphic_models import BaseQuestion, MultipleChoiceQuestion, TextBoxQuestion
   ```

2. Create migration:
   ```bash
   python manage.py makemigrations playthrough
   python manage.py migrate
   ```

3. Use in code:
   ```python
   # Create different question types
   mcq = MultipleChoiceQuestion.objects.create(
       topic=topic,
       question_text="What is 2+2?",
       choices_json={'A': 'One', 'B': 'Four', 'C': 'Three', 'D': 'Five'},
       correct_answer='B'
   )

   # Query specific types
   all_mcqs = MultipleChoiceQuestion.objects.all()
   ```

**Current Status**: This is a reference implementation. The old `Question` model is still in use. When you're ready to migrate (v1.5/v2.0), use this as a template.

**File Locations**:
- `playthrough/polymorphic_models.py` — Reference implementation
- `QUESTION_MODEL_REFACTORING.md` — Design + migration strategy

---

### ✅ API Integration Tests

**What changed**: 13 test classes for end-to-end API flows

**How to run**:
```bash
# Run API integration tests
python manage.py test playthrough.test_api_integration --verbosity=2

# Run specific test class
python manage.py test playthrough.test_api_integration.PlaythroughAPIAuthenticationTests
```

**Test Coverage**:
- Authentication (permissions)
- Session management (initialization, persistence)
- Question serving (field validation, no-repeat)
- Answer submission (scoring, DDA)
- Modifiers (equipment effects)
- End-to-end flows

**File**: `playthrough/test_api_integration.py`

**Note**: Some tests require refinement to match actual API responses. See comments in test file.

---

### 🛡️ Migration Strategy Guide

**What changed**: Comprehensive guide for safe schema changes

**How to use**:

1. **Before making schema changes**, read:
   ```bash
   cat MIGRATION_STRATEGY.md
   ```

2. **Key guidelines**:
   ```
   ✅ DO:   Add columns, add tables, add nullable fields
   ❌ DON'T: Remove columns, change types without testing
   ```

3. **Workflow for safe migrations**:
   ```bash
   # 1. Make model changes
   vim playthrough/models.py

   # 2. Create migration
   python manage.py makemigrations playthrough

   # 3. Inspect migration
   cat playthrough/migrations/XXXX_*.py

   # 4. Test in staging
   python manage.py migrate --plan  # preview
   python manage.py migrate          # apply

   # 5. Verify with tests
   python manage.py test
   ```

**File**: `MIGRATION_STRATEGY.md` (8k+ comprehensive guide)

---

## Workflow: Development Cycle

### Typical Day:

1. **Morning: Pull & Setup**
   ```bash
   git pull origin main
   pip install -r requirements.txt
   ```

2. **Make Changes**
   - Edit models, views, etc.
   - Add tests in `playthrough/tests.py` or `accounts/tests.py`

3. **Run Tests Before Committing**
   ```bash
   python manage.py test --verbosity=2
   ```

4. **View API Docs While Developing**
   ```bash
   python manage.py runserver
   # Open http://localhost:8000/api/docs/
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

---

## VS Code Extensions (Recommended)

Install these for best experience:

1. **Python** (Microsoft) — `ms-python.python`
   - Syntax highlighting, debugging, testing

2. **Django** (Baptiste Darthenay) — `batisteo.vscode-django`
   - Template highlighting, URL resolution

3. **REST Client** (Huachao Mao) — `humao.rest-client`
   - Test API endpoints without Postman

4. **Thunder Client** (Ranga Vadhineni) — `rangav.vscode-thunder-client`
   - Alternative REST testing tool (built-in)

5. **SQLite** (alexcvzz) — `alexcvzz.vscode-sqlite`
   - View/query test database

6. **Git Graph** (mhutchie) — `mhutchie.git-graph`
   - Visualize git branches and commits

**Install all**:
```bash
code --install-extension ms-python.python
code --install-extension batisteo.vscode-django
code --install-extension humao.rest-client
code --install-extension rangav.vscode-thunder-client
code --install-extension alexcvzz.vscode-sqlite
code --install-extension mhutchie.git-graph
```

---

## Debugging in VS Code

### 1. Django Debug Toolbar (Optional)
```bash
pip install django-debug-toolbar

# Add to settings.py INSTALLED_APPS:
'debug_toolbar',

# Add to urls.py:
path('__debug__/', include('debug_toolbar.urls')),
```

### 2. VS Code Debugger
Create `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Django",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/manage.py",
            "args": ["runserver"],
            "django": true,
            "jinja": true
        },
        {
            "name": "Python: Tests",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/manage.py",
            "args": ["test"],
            "django": true
        }
    ]
}
```

Then press `F5` to start debugging!

---

## Troubleshooting

### Problem: Tests fail with import errors
```
ModuleNotFoundError: No module named 'drf_spectacular'
```
**Solution**:
```bash
pip install -r requirements.txt
```

### Problem: `.env` file not found
**Solution**:
```bash
# Verify it exists at project root
ls -la .env  # Linux/Mac
dir .env    # Windows

# If missing, create it with your values
touch .env
echo "DEBUG=True" >> .env
```

### Problem: API docs show 404
**Solution**:
1. Ensure `drf_spectacular` is in `INSTALLED_APPS`
2. Restart dev server: `python manage.py runserver`
3. Visit `http://localhost:8000/api/docs/`

### Problem: Tests run but show warnings
**Solution**: These are normal — Django model warnings about AutoField. Can be ignored for development.

---

## Key Files Reference

| File | Purpose | Open with |
|------|---------|-----------|
| `IMPLEMENTATION_COMPLETE.md` | Summary of all changes | VS Code Editor |
| `MIGRATION_STRATEGY.md` | Safe migration patterns | VS Code Editor |
| `QUESTION_MODEL_REFACTORING.md` | Polymorphic design | VS Code Editor |
| `playthrough/tests.py` | Unit tests (33 tests) | Test Explorer |
| `playthrough/test_api_integration.py` | API tests (13 classes) | Test Explorer |
| `playthrough/polymorphic_models.py` | Reference implementation | Editor |
| `.env` | Secrets/config | Never commit! |
| `requirements.txt` | Python dependencies | `pip install -r requirements.txt` |

---

## Next Steps

### Immediate (Today)
1. ✅ Pull latest changes: `git pull origin main`
2. ✅ Install dependencies: `pip install -r requirements.txt`
3. ✅ Run tests: `python manage.py test`
4. ✅ View API docs: `python manage.py runserver` → http://localhost:8000/api/docs/

### Short Term (This week)
1. Review `MIGRATION_STRATEGY.md` for best practices
2. Try adding a test to `playthrough/tests.py`
3. Use REST Client to test API endpoints

### Medium Term (This month)
1. Implement polymorphic Question models when ready
2. Add more API integration tests based on actual flows
3. Set up CI/CD pipeline to run tests on push

### Long Term (Roadmap)
1. **v1.5**: Add Domain model (MIGRATION_STRATEGY.md section 5)
2. **v2.0**: Migrate to polymorphic Question models
3. Add caching, rate limiting, performance monitoring

---

## Questions?

All documentation is in the repo:
- `IMPLEMENTATION_COMPLETE.md` — Detailed summaries
- `MIGRATION_STRATEGY.md` — Schema change patterns
- `QUESTION_MODEL_REFACTORING.md` — Architecture decisions
- Code docstrings in `playthrough/views.py`, `accounts/views.py`

Check the Swagger UI for interactive API documentation:
- `http://localhost:8000/api/docs/`

---

**Happy coding! 🚀**
