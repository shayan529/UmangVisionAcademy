Agent Instructions — MERN Stack Projects
This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment. Tailored for MongoDB + Express + React + Node.js (MERN) projects.
You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most application logic — API contracts, database schemas, and UI state — is deterministic and requires consistency. This system fixes that mismatch.
The 3-Layer Architecture
Layer 1: Directive (What to do)
•	SOPs written in Markdown, live in directives/
•	Define the goal, inputs, endpoints/components/scripts to use, outputs, and edge cases
•	Natural language instructions, like you'd give a mid-level full-stack engineer
•	Examples: directives/add_api_endpoint.md, directives/create_react_component.md, directives/write_mongoose_model.md
Layer 2: Orchestration (Decision making)
•	This is you. Your job: intelligent routing across the stack.
•	Read directives, decide which layer of the stack a change belongs in (client, server, or database), call execution tools in the right order, handle errors, ask for clarification, update directives with learnings
•	You're the glue between intent and execution. E.g. you don't hand-write ad-hoc database queries in a one-off script — you read directives/query_database.md and either call an existing server/services/* function or add one
•	You decide whether a request needs a new API route, a new React component, a schema change, or just wiring existing pieces together
Layer 3: Execution (Doing the work)
•	Deterministic, testable code split by concern:
◦	server/ — Express app: routes/, controllers/, models/ (Mongoose schemas), middleware/, config/
◦	client/ — React app: src/components/, src/pages/, src/hooks/, src/services/ (API calls)
◦	scripts/ — Node.js utility scripts: seeders, migrations, one-off data fixes
•	Environment variables and API tokens are stored in .env (server) and client/.env (React, using REACT_APP_ prefixes as required by the build tool)
•	Handle HTTP requests, database reads/writes, auth, validation, and rendering. Reliable, testable, fast. Use scripts and reusable functions instead of manual, one-off work. Commented well.
Why this works: if you hand-roll every API call, query, and component from scratch each time, errors compound. 90% accuracy per step = 59% success over 5 steps. The solution is to push complexity into deterministic, reusable code (routes, models, components, services) so you just focus on decision-making and wiring.
Operating Principles
1. Check for tools first
•	Before writing a new route, controller, model, or component, check server/ and client/src/ per your directive. Search for existing reusable pieces (services, hooks, utils) before creating new ones.
2. Self-anneal when things break
•	Read the error message and stack trace (server logs, browser console, or failed test output)
•	Fix the code and re-run tests (npm test / jest / npm run test:client) — unless the fix touches paid APIs or third-party tokens/credits, in which case check with the user first
•	Update the directive with what you learned (rate limits, schema quirks, CORS issues, auth edge cases)
•	Example: you hit a MongoDB duplicate-key error on a unique index → you inspect the schema → add proper validation/error handling in the controller → write a test to cover it → update the directive with the constraint.
3. Update directives as you learn
•	Directives are living documents. When you discover API rate limits, schema constraints, auth flows, or better patterns — update the directive. But don't create or overwrite directives without asking, unless explicitly told to. Directives are the instruction set and must be preserved (and improved over time, not extemporaneously used and discarded).
Self-Annealing Loop
1.	Fix it
2.	Update the route, controller, model, hook, or component
3.	Test it — npm test on the server, npm run test (React Testing Library) on the client, or a manual curl/Postman check for quick API verification
4.	Update the directive to include the new flow
5.	System is now stronger
File Organization
Deliverables vs Intermediates
•	Deliverables: the running application (client + server), deployed environments (e.g. Vercel/Netlify for client/, Render/Railway/Heroku for server/), the MongoDB Atlas database, and version-controlled source in Git
•	Intermediates: local build output (client/dist or client/build), seed data, migration exports, logs — temporary files needed during development
Directory Structure
•	client/ — React app (components, pages, hooks, services, assets)
•	server/ — Express app (routes, controllers, models, middleware, config)
•	scripts/ — Node.js utility scripts (seeders, migrations, backfills)
•	directives/ — SOPs in Markdown (the instruction set)
•	tests/ or co-located *.test.js — Jest/Supertest (server), React Testing Library (client)
•	.tmp/ — All intermediate files (seed dumps, scraped data, temp exports). Never commit, always regenerated.
•	.env — Server environment variables and API keys
•	client/.env — Client-side environment variables (build-time only, never put secrets here — they ship to the browser)
•	.gitignore — Must exclude node_modules/, .env, .tmp/, and build output
Key principle: local build artifacts and intermediate files are only for processing. Deliverables are the deployed client, deployed server, and the live database — where the user actually accesses the application. Everything in .tmp/ and build output directories can be deleted and regenerated.
MERN Stack Conventions
API Design
•	RESTful routes under a versioned prefix, e.g. /api/v1/resource
•	Controllers stay thin — validation and business logic live in server/services/ or server/middleware/, not inline in route handlers
•	Consistent JSON response shape ({ success, data, error }) across all endpoints, defined once in a directive
Database (MongoDB / Mongoose)
•	Schemas live in server/models/, one file per collection, with validation rules defined at the schema level
•	Indexes and unique constraints declared explicitly in the schema, not assumed
•	Migrations/backfills are one-off scripts in scripts/, never run manually against production without user confirmation
Testing
•	Server: Jest + Supertest for route/controller tests, hitting a test database or in-memory MongoDB
•	Client: React Testing Library for component behavior, not implementation details
•	New endpoints or components should ship with at least one test before being marked done
Environment & Secrets
•	Never commit .env files. Reference .env.example for required keys
•	Client-side env vars are public by nature (bundled into the browser build) — secrets belong only in server/.env
Git Workflow
•	Feature branches per directive/task, descriptive commit messages
•	Don't commit node_modules/, build output, or .tmp/

Summary
You sit between human intent (directives) and deterministic execution (Express routes, Mongoose models, React components, Node scripts). Read instructions, decide which layer of the MERN stack a change belongs in, call the right tools, handle errors, and continuously improve the system.
Be pragmatic. Be reliable. Self-anneal.
