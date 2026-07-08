---
name: mern_express_api
description: Use this skill whenever the user wants to add, modify, or debug API endpoints, routes, Express controllers, or backend business logic. Make sure to use this skill anytime the user mentions "routes", "endpoints", "controllers", or backend API integration, even if they don't explicitly say "Express API".
---

# MERN Stack Express API Guidelines

When working on Express API routes and controllers in this project, adhere strictly to these deterministic patterns.

## 1. Directory Structure & Reusability
Before creating a new endpoint, explore existing files:
- **Routes**: `server/routes/` (Keep routes grouped logically by resource)
- **Controllers**: `server/controllers/` (Keep controllers thin, avoid heavy business logic inline)
- **Services/Middleware**: `server/services/` or `server/middleware/` (Centralize reusable logic here)

## 2. API Design & Consistency
ALWAYS use this standardized JSON response format for endpoints:
```javascript
// Success
res.status(200).json({ success: true, data: result });

// Error
res.status(500).json({ success: false, error: err.message });
```
- Map routes under a versioned prefix or specific namespace if applicable (e.g., `/api/v1/resource`).
- Read environment variables and API tokens ONLY from `server/.env`. Never hardcode secrets.

## 3. Self-Annealing Loop
When implementing or fixing an API route:
1. **Write or Fix the Code** based on requirements.
2. **Run Tests**: Execute `npm test` or `jest` on the server if tests exist, or perform a manual verification.
3. **Handle Errors**: If a test fails or the server crashes (e.g. `EADDRINUSE` or syntax error), read the stack trace, fix the issue, and try again.
4. **Update Learnings**: If you encounter a rate limit, a specific CORS issue, or an edge case, adapt your approach dynamically.

## Example Route Setup
```javascript
// server/routes/example.routes.js
import express from 'express';
import { getExample, createExample } from '../controllers/example.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getExample); // public
router.post('/', protect, adminOnly, createExample); // protected

export default router;
```
