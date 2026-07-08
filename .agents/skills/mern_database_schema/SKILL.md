---
name: mern_database_schema
description: Use this skill whenever the user wants to design, modify, or troubleshoot MongoDB schemas, Mongoose models, or database constraints. Trigger this for mentions of "schema", "model", "database design", or "indexes", even if they don't explicitly say "Mongoose".
---

# MERN Stack Mongoose Schema Guidelines

When creating or modifying database schemas, rely on Mongoose's built-in validation and constraints.

## 1. Schema Placement
- Define each model in a single file inside `server/models/`.
- Ensure standard exports (e.g., `export default mongoose.model("User", userSchema)`).

## 2. Validation & Constraints
- Validate everything at the schema level. Use Mongoose built-in validators (`required`, `minlength`, `maxlength`, `enum`, `match`).
- Declare unique constraints explicitly in the schema (e.g., `email: { type: String, unique: true }`).
- Do not assume indexes are built automatically; if needed, define them explicitly `schema.index({ field: 1 })`.

## 3. Relationships & References
- Use `mongoose.Schema.Types.ObjectId` for relationships and provide a `ref` matching the target model name.
- Be cautious with deep population; favor storing essential duplicated data if performance is a critical bottleneck, or ensure indexes exist on foreign keys.

## 4. Self-Annealing Loop
- If you encounter MongoDB duplicate-key errors (`E11000`) or validation errors during tests or route execution:
  1. Inspect the schema constraints.
  2. Modify the controller to handle these errors gracefully (returning a 400 with a clean message) instead of crashing the server.
  3. If the schema is flawed, update the schema and write a migration script if old data is breaking it.
