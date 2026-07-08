---
name: create_react_component
description: Use this skill when creating or modifying a React component in the client application.
---

# Create React Component

When asked to create or update a React component in the MERN stack architecture, follow these instructions:

## 1. Check for Reusability
- Before writing a new component, check `client/src/components/`, `client/src/hooks/`, and `client/src/services/` for existing reusable pieces.
- Don't reinvent the wheel if a UI component already exists.

## 2. Component Design
- Write clean, functional components using React hooks.
- Keep components focused and modular.
- API calls should ideally be abstracted into `src/services/` or custom hooks in `src/hooks/`.
- Ensure environment variables for the client are prefixed appropriately (e.g. `REACT_APP_` or `VITE_` depending on the build tool). Never put secrets in client env vars.

## 3. Testing and Verification
- Use React Testing Library for component behavior tests if applicable.
- Make sure to test in the browser to ensure the component renders and behaves correctly.
- If it breaks, check the browser console for stack traces, self-anneal by fixing the code, and retry.

## 4. Temporary Files
- Any temporary or intermediate files should be stored in `.tmp/` and never committed to source control.
