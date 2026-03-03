# Project Context

**Goal:** A local-first, interactive web application to visualize GCP Asset Inventory exports.
**Philosophy:** Client-side only. No backend. Logic is defined by Markdown specs in `assets/` and implemented in TypeScript.

## Architecture & Logic

- **Logic Source of Truth:** The `assets/` directory (e.g., `assets/parser.md`) contains the *specifications* for how assets must be parsed.
- **Implementation:** `frontend/src/utils/parser.ts` implements these specifications.
- **State:** `App.tsx` holds the application state.

## Tech Stack Standards

- **Framework:** React 19 + Vite + TypeScript.
- **Styling:** Tailwind CSS v4 (Use utility classes, do not create css files).
- **Icons:** Lucide React.
- **Visualization:** `react-force-graph-2d`.

## Always do

1. **Read deeply**
   - Understand the parsing logic in `assets/` before touching `parser.ts`.
   - Analyze `App.tsx` for state flow before creating components.
2. **Write a plan**
   - Draft a detailed step-by-step plan.
3. **Annotate the plan until it's right**
   - Iterate on the plan. Verify it against the `assets/` specs.
   - Ensure you aren't introducing backend dependencies.
4. **Execute the whole thing without stopping, checking types all the way**
   - Implement the plan completely.
   - Run `npm run build` in the `frontend/` directory to verify type safety.
