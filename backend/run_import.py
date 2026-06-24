#!/usr/bin/env python
"""
Quick script to apply migrations and import all questions.
Run this from the backend directory: python run_import.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'equinoxSite.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.management import call_command

print("=" * 60)
print("APPLYING MIGRATIONS")
print("=" * 60)
call_command('migrate', verbosity=2)

print("\n" + "=" * 60)
print("IMPORTING ALL QUESTIONS")
print("=" * 60)
call_command('import_all_questions', verbosity=2)

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)