---
name: mern_utility_scripts
description: Use this skill whenever the user wants to write one-off Node.js scripts, database seeders, data migrations, or backfills. Trigger this for mentions of "seeder", "migration", "script", or "backfill", even if they don't explicitly say "Node.js script".
---

# MERN Stack Utility Scripts Guidelines

When writing utility scripts for seeding, data migration, or administrative backfills, follow these safety and structure guidelines.

## 1. File Organization
- ALL utility scripts must be placed in the `scripts/` directory at the root of the project.
- Do not clutter the `server/` or `client/` directories with one-off executable scripts.

## 2. Safe Execution Environment
- Scripts MUST securely connect to the MongoDB instance using environment variables from `.env`.
- Ensure the script disconnects from the database (`mongoose.disconnect()`) when finished, whether it succeeds or throws an error.

## 3. Production Safeguards
- NEVER run migration scripts manually against production databases without explicit user confirmation.
- Build dry-run capabilities into backfill scripts if dealing with highly sensitive user data.
- Output clear logs detailing what the script is doing (e.g., "Updated 15 user records").

## 4. Temporary Data Exports
- If a script exports data (e.g., CSV dumps, JSON scrapes), place the output files in the `.tmp/` directory.
- Remind the user that `.tmp/` is in `.gitignore` and is safe for intermediate processing.
