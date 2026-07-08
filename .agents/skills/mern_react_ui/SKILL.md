---
name: mern_react_ui
description: Use this skill whenever the user wants to build, update, or style React frontend components, custom hooks, or frontend API service calls. Trigger this for any mentions of "UI", "components", "pages", "hooks", or client-side behavior, even if they don't explicitly say "React component".
---

# MERN Stack React UI Guidelines

When building or updating the client side of the application, follow these guidelines to ensure consistency and reliability.

## 1. Modularity & Reusability
- **Components**: Place UI elements in `client/src/components/`. If it's a full page route, place it in `client/src/pages/`.
- **Hooks**: Place reusable React hooks in `client/src/hooks/`.
- **Services**: Abstract API calls away from components. Place API logic in `client/src/services/` using libraries like Axios or native fetch.

## 2. API Integration & Environment Variables
- ALWAYS prefix client-side environment variables according to the build tool (e.g., `REACT_APP_` for CRA or `VITE_` for Vite). 
- **Security**: NEVER expose secrets (API keys, database passwords) in client `.env` files, as they ship directly to the user's browser.
- Handle loading, success, and error states gracefully in UI components.

## 3. Styling
- Use Tailwind CSS or modular CSS as preferred by the project's existing configuration.
- Avoid inline styles unless strictly necessary for dynamic variables.

## 4. Self-Annealing
- If a component fails to compile or crashes the browser tab:
  1. Inspect the terminal output for the frontend server (e.g. `npm run dev` in `client/`).
  2. Inspect the browser console stack trace.
  3. Fix the underlying React issue (like infinite loops in `useEffect`, missing keys in maps) and reload.
