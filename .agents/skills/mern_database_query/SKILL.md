---
name: mern_database_query
description: Use this skill whenever the user wants to query, aggregate, or extract data from MongoDB. Trigger this when asked to write database queries, aggregations, data fetching logic, or to debug a database query.
---

# MERN Stack Database Query Guidelines

When querying or aggregating data from MongoDB via Mongoose, follow these guidelines to maximize performance and maintainability.

## 1. Avoid Ad-Hoc Scripts
- Do not write one-off manual scripts to run against the live production database unless explicitly confirmed by the user.
- Prefer encapsulating complex queries and aggregations into reusable functions within `server/services/` or directly inside the `server/controllers/`.

## 2. Query Optimization
- Use `.lean()` for read-only queries where you do not need Mongoose document methods (`.save()`, virtuals, etc.). It significantly improves performance.
- When using `.populate()`, only select the fields you need (e.g., `.populate('user', 'name email')`) to reduce memory consumption.
- Use MongoDB Aggregation pipelines (`Model.aggregate([...])`) for complex joins, grouping, and statistical calculations.

## 3. Self-Annealing
- If a query is slow, fails with a timeout, or returns incorrect data:
  1. Print the query parameters.
  2. Ensure the required indexes exist in the schema.
  3. Re-write the query or aggregation to be more efficient.
  4. Document your learnings in the related workflow if it helps prevent future bugs.
