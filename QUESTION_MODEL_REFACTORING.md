"""
Question Model Polymorphism Guide
===================================

This file documents the planned refactoring for Question models.

CURRENT STATE (Monolithic):
- Single Question model handles MCQ, TextBox, T/F questions
- Fragile validation (optional MCQ fields mixed with text answer)
- Unclear code intent

PROPOSED STATE (Polymorphic with Multi-Table Inheritance):
- AbstractQuestion: Common fields (topic, text, difficulty, grade_level)
- MultipleChoiceQuestion: 4 choice options, single correct choice (A/B/C/D)
- TextBoxQuestion: Free-form text answer, optional fuzzy matching
- TrueFalseQuestion: Boolean answer

MIGRATION STRATEGY
==================

Phase 1 (Current):
- Keep existing Question model for backward compatibility
- Add 'question_type' field to track actual type
- Existing questions still work via Question model

Phase 2 (When ready to refactor):
1. Create new abstract and concrete question models
2. Run migration to add inherited tables
3. Create data migration to copy existing questions
4. Update views to use new models
5. Deprecate old Question model

Phase 3 (Clean-up):
- Remove old Question model (after sufficient time/major version bump)

IMPLEMENTATION NOTES
====================

Multi-table inheritance means:
- Each question type has its own DB table
- Base fields stored in parent table
- Type-specific fields in child tables
- Object creation: MultipleChoiceQuestion(...) auto-handles inheritance
- Queries: Can query base Question.objects.all() or MCQuestion.objects.filter(...)

Benefits:
- Type safety at database level
- Clear field requirements per type
- Prevents invalid field combinations
- Efficient queries when type is known
- Self-documenting code

Drawbacks:
- More database queries (joins) for heterogeneous queries
- More complex migrations
- Requires careful rollout plan

ALTERNATIVES CONSIDERED
========================

1. Single Table with Polymorphism Flag:
   - Simpler initially but fraught with validation issues
   - Doesn't scale to 5+ types well

2. JSONField with full polymorphism:
   - Very flexible but type validation at runtime
   - Loses database schema documentation

3. Proxy models (current least painful option):
   - No database changes
   - Can add type-specific methods
   - But can't add type-specific fields

Current recommendation: Multi-table inheritance (Phase 2 approach)
"""
