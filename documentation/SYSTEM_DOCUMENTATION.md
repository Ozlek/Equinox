# Equinox System Documentation

## Overview
Equinox is an adaptive math learning platform that provides personalized math practice for students grades 1-10, with dynamic difficulty adjustment based on student performance.

## Architecture
- **Backend**: Django 5.2.15 (Python)
- **Frontend**: React 19.2.6 + Vite 8.0.12
- **Database**: SQLite (development) / PostgreSQL (production)
- **API**: RESTful with JWT authentication

## Key Features
- Adaptive difficulty adjustment via DDA (Dual-Algorithmic Dynamic Difficulty Adjustment)
- 5 math domains: Arithmetic, Algebra, Geometry, Statistics, Trigonometry
- 50 procedural question templates
- Grade levels 1-10 (Elementary: 1-6, Junior High: 7-10)
- Three difficulty tiers: Novice (1.0), Intermediate (2.0), Advanced (3.0), Expert (4.0)
- Gamification with stars, achievements, and shop items
- Instructor/admin question management with change request workflow

## Quick Start
1. Backend: `cd backend && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt`
2. Frontend: `cd frontend && npm install && npm run dev`
3. Run imports: `cd backend && python run_import.py`
4. Start both servers

## Directory Structure
```
backend/
├── equinoxSite/     # Django project settings
├── manage.py        # Django CLI entry point
├── requirements.txt # Python dependencies
├── .env             # Environment variables
├── db.sqlite3       # Development database
├── accounts/        # User management
├── dashboard/       # Dashboard views
├── pages/           # Static pages
├── topics/          # Topics and lessons
├── playthrough/     # DDA engine and questions
├── users_progress/# User progress and achievements
├── static/          # Static files
├── templates/       # Django templates
├── verify_fix.py    # Grade level fix verification
└── verify_import.py # Import verification

frontend/
├── src/             # React source files
├── package.json     # Node dependencies
├── vite.config.js   # Vite configuration
├── index.html       # HTML entry point
└── dist/            # Build output
```