---
name: add_api_endpoint
description: Use this skill when creating a new API endpoint on the Express server.
---

# Add API Endpoint

When asked to add a new API endpoint, follow these instructions to maintain the deterministic, 3-layer architecture:

## 1. Check Existing Tools
Before writing a new route or controller, search the `server/` directory for existing reusable pieces.
- Controllers stay thin — validation and business logic live in `server/services/` or `server/middleware/`, not inline in route handlers.
- Check `server/routes/` to see if a similar endpoint already exists.

## 2. Implement the Route
- RESTful routes under a versioned prefix, e.g. `/api/v1/resource`.
- Ensure consistent JSON response shape (`{ success, data, error }`) across all endpoints.
- Environment variables and API tokens must be read from `server/.env`. Do NOT hardcode secrets.

## 3. Test and Self-Anneal
- After writing the route and controller, test it (e.g. using Jest/Supertest if tests exist, or a quick manual check).
- If things break, read the error message and stack trace.
- Fix the code and re-run tests.

## 4. Documentation
- Document the new endpoint and any edge cases discovered.
- Keep controllers well-commented.
