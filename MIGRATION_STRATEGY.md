# Migration Stability Strategy for Equinox

## Overview

This document outlines best practices for safely managing database schema changes in Django, with specific guidance for the Equinox project.

## Problem: Schema Evolution Complexity

Equinox went from v1.0 → v1.4 in 10 days with significant schema changes:
- v1.1: Database rework
- v1.2: Complete architecture recode
- v1.3-1.4: Achievements, leaderboards, modifiers, gamification

**Risks of rapid iteration:**
- ❌ Data loss if migrations aren't careful
- ❌ Silent failures with old code + new schema
- ❌ Difficult rollbacks if production breaks
- ❌ Breaking changes for existing users

## Safe Migration Pattern

### Rule #1: Add, Don't Remove (Immediately)

```python
# ❌ RISKY: Remove field directly
class Question(models.Model):
    # choice_a removed!
    choice_b = models.CharField(max_length=255)

# ✅ SAFE: Mark as deprecated first
class Question(models.Model):
    choice_a = models.CharField(max_length=255, null=True, blank=True)  # DEPRECATED v1.5
    choice_b = models.CharField(max_length=255)
```

**Timeline:**
```
v1.4.0: Add new_field (default value, optional)
v1.5.0: Document deprecation of old_field
v1.6.0: Remove old_field in MAJOR version bump
```

### Rule #2: New Fields Need Defaults

```python
# ❌ RISKY: New required field, existing data has NULL
class UserProgress(models.Model):
    gamified_score = models.IntegerField()  # Existing rows: NULL!

# ✅ SAFE: Default value or nullable
class UserProgress(models.Model):
    gamified_score = models.IntegerField(default=0)  # Auto-populated
    # OR
    gamified_score = models.IntegerField(null=True, blank=True)  # Optional
```

### Rule #3: Change Type Carefully

```python
# ❌ RISKY: Changing field type truncates data
class Question(models.Model):
    correct_answer = models.CharField(max_length=50)  # Was 255, NOW 50!

# ✅ SAFE: Use a separate field
class Question(models.Model):
    correct_answer = models.CharField(max_length=255)  # Keep old
    correct_answer_new = models.CharField(max_length=50, null=True)  # New schema
    
    # In application code:
    def get_answer(self):
        return self.correct_answer_new or self.correct_answer
```

**Later (v2.0):**
```python
# Data migration: copy old → new (with cleanup)
def migrate_answers(apps, schema_editor):
    Question = apps.get_model('playthrough', 'Question')
    for q in Question.objects.all():
        q.correct_answer_new = q.correct_answer[:50]
        q.save()

# Then safely remove old field
```

### Rule #4: Make Changes Reversible

```bash
# Create migration
python manage.py makemigrations --name add_gamified_score

# Review the migration file BEFORE running
cat playthrough/migrations/000X_add_gamified_score.py

# Run on test database first
python manage.py migrate --plan  # See what will happen
python manage.py migrate --fake-initial  # If starting fresh

# Keep old migrations, never edit them
# (Old migrations are your rollback plan)
```

### Rule #5: Test Every Migration

```bash
# On LOCAL:
1. Backup db.sqlite3
2. Run migration
3. Run test suite
4. Verify data integrity
5. Run reverse migration (test rollback)
6. Re-run forward migration

# Then MERGE to main

# On STAGING (before production):
1. Create backup
2. Apply migration
3. Monitor for 24-48 hours
4. Then promote to PRODUCTION
```

## Specific Recommendations for Equinox

### For Question Model Refactoring (Rec #4)

**Phase 1: Add new models (SAFE)**
```python
# Add alongside existing Question
class MultipleChoiceQuestion(BaseQuestion):
    choice_a = models.CharField(...)
    correct_choice = models.CharField(...)

# Old Question model still works
# Existing code unchanged
# No data loss
```

**Phase 2: Gradual migration**
```python
# New code uses MCQuestion
# Old code still works with Question
# View layer accepts both

# Gradually migrate in view code:
try:
    q = MultipleChoiceQuestion.objects.get(id=qid)
except MultipleChoiceQuestion.DoesNotExist:
    q = Question.objects.get(id=qid)  # Fallback to old
```

**Phase 3: Cleanup (v2.0+)**
```python
# MAJOR version bump
# Remove old Question model
# Force migration of remaining questions
```

### For Domain Model Changes (Hypothetical)

**Current (FRAGILE):**
```python
# Domain hardcoded in code
domain_map = {
    "Algebra": self.algebra_rating,
    "Geometry": self.geometry_rating,  # Add new = code change + migration!
}
```

**Migration Plan:**
```
v1.5.0:
  1. Create Domain model
  2. Create UserDomainRating (per-domain tracking)
  3. Keep old fields (algebra_rating, etc.)
  4. Populate UserDomainRating from old fields
  
v1.6.0+:
  1. Use UserDomainRating in all views
  2. Deprecate old fields
  
v2.0.0:
  1. Remove old fields (backward-incompatible)
```

## Checklist: Before Every Migration

- [ ] Migration has descriptive name: `add_gamified_score` (not `0001_auto`)
- [ ] New fields have defaults or are nullable
- [ ] Data migration planned if renaming fields
- [ ] Rollback tested locally
- [ ] Test suite passes with new schema
- [ ] Documented in CHANGELOG
- [ ] Backward compatibility maintained (if not MAJOR version)
- [ ] Database backup exists
- [ ] Team notified of breaking changes (if any)

## Emergency Rollback

```bash
# See all migrations
python manage.py showmigrations

# Rollback one migration
python manage.py migrate playthrough 0003_previous_state

# Rollback entire app
python manage.py migrate playthrough zero

# Reapply (carefully)
python manage.py migrate
```

## Database Backup Strategy

```bash
# Before any migration on production:

# Backup entire database
cp db.sqlite3 db.sqlite3.backup.2026-06-19

# Or export for recovery
python manage.py dumpdata > equinox_backup.json

# After migration, keep backup for 2 weeks
# Then delete if everything stable
```

## Version Numbering: Semantic Versioning

```
v1.4.0 - Current stable (backward compatible)
  ├─ 1.4.1 - Patch: Bug fix, hotfix
  ├─ 1.5.0 - Minor: New features (backward compatible)
  └─ 2.0.0 - Major: Breaking changes (e.g., remove old Question model)
```

**Migration strategy by version:**
- v1.4 → v1.5 (minor): Can safely run auto-migrations without data loss
- v1.5 → v2.0 (major): Deprecation warnings start appearing in v1.5
- Breaking changes only in MAJOR version bumps

## Equinox v1.5 Roadmap (PROPOSED)

**v1.5 Release (Stable Schema)**
- [ ] All current tests passing (33+ tests)
- [ ] Document all DB fields
- [ ] Add API docs (Swagger) ✅
- [ ] Refactor Question model with new polymorphic design (coexist with old)
- [ ] Create Domain model (coexist with hardcoded domains)
- [ ] Data validation layer added

**v1.6 Release (Cleanup)**
- [ ] Gradual migration to new models
- [ ] Deprecation warnings for old approach

**v2.0 Release (Breaking)**
- [ ] Remove old Question model
- [ ] Remove hardcoded domain strings
- [ ] Clean schema, better performance

## Helpful Commands

```bash
# See pending migrations
python manage.py showmigrations --plan

# Create empty migration for manual work
python manage.py makemigrations playthrough --empty --name add_indexes

# Show migration dependencies
python manage.py showmigrations playthrough

# Fake a migration (use with CAUTION)
python manage.py migrate playthrough --fake 0003_add_field

# Create migration without model changes (data migration)
python manage.py makemigrations --empty playthrough --name migrate_questions_data

# Test migration on new database
rm db.sqlite3 && python manage.py migrate && python manage.py test
```

## Summary

✅ **Safe to do:**
- Add new optional fields (nullable, with defaults)
- Add new models
- Add new tables
- Rename models (via data migration)

❌ **Unsafe without careful planning:**
- Remove fields
- Make optional field required
- Change field type
- Rename fields (need data migration)
- Delete tables

**Golden Rule:** If it can cause data loss or break existing code, plan for it in advance with deprecation period.
