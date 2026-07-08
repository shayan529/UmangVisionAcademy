---
name: write_mongoose_model
description: Use this skill when creating or modifying a Mongoose schema/model.
---

# Write Mongoose Model

When asked to create or update a Mongoose database schema or model, adhere to these guidelines:

## 1. Schema Placement and Structure
- Schemas live in `server/models/`, one file per collection.
- Define validation rules rigorously at the schema level.
- Keep the schema focused on deterministic data structures.

## 2. Indexes and Constraints
- Declare indexes and unique constraints explicitly in the schema (do not assume they are applied).
- Understand schema constraints: if you hit a duplicate-key error or validation error during tests, self-anneal by fixing the data or handling the error gracefully in the controller.

## 3. Migrations and Data Manipulation
- If you need to backfill data or run migrations, write one-off scripts in the `scripts/` directory.
- NEVER run migration scripts manually against production without user confirmation.

## 4. Updates to Directives
- If you discover specific schema quirks, update the relevant knowledge base or ask the user to refine the guidelines.
- Always use reusable schema practices.
