---
name: query_database
description: Use this skill when querying the database.
---

# Query Database

When asked to query the database or extract data, follow these guidelines:

## 1. Avoid Ad-Hoc Scripts
- Do not write one-off manual scripts to run against production.
- Use reusable server/services/* functions if they exist.

## 2. Abstraction
- Keep database queries inside controller or service files.
- If you need a utility for seeders or one-off data fixes, place it in `scripts/`.
- Verify the query logic handles errors robustly.

## 3. Self-Annealing
- If you hit rate limits, unique constraints, or MongoDB connection errors, fix them, test again, and document the learnings here.
