# Repository Guidelines

## Project Structure & Module Organization
This repository is for a provider-agnostic JSON API behind `https://api.thanejoss.com/api`. Preserve the `/api` route prefix exactly and keep the implementation free of Cloudflare-only bindings. As code is added, place HTTP handlers in `src/routes/`, shared response and validation helpers in `src/lib/`, and static seed payloads for `services` and `apps` in `src/data/`. Put tests under `tests/` or next to source files as `*.test.ts`.

## Build, Test, and Development Commands
The workspace is not scaffolded yet, so standard scripts are not defined. When initializing the project, expose root-level commands such as:

- `npm run dev` to run the API locally
- `npm test` to execute the test suite
- `npm run lint` to check style and common mistakes
- `npm run typecheck` to validate TypeScript contracts

If Hono is used, keep local development runnable without Cloudflare-only bindings.

## Coding Style & Naming Conventions
Prefer TypeScript with Hono. Use 2-space indentation, `camelCase` for variables and functions, `PascalCase` for types, and `kebab-case` for route or module filenames such as `contact-route.ts`. Keep handlers small and move reusable logic into `src/lib/`. All responses should use a consistent envelope: `{"success": true, "data": ...}` or `{"success": false, "error": {"code": "...", "message": "..."}}`.

## Testing Guidelines
Test the contract, not just the implementation. Cover:

- `GET /api/health`, `GET /api/services`, and `GET /api/apps` returning `200`
- `POST /api/contact` returning `202` for valid payloads
- `400` cases for invalid JSON and validation failures
- `404` for unknown `/api` routes
- CORS behavior for `https://thanejoss.com`

Name tests after the route or behavior they verify, for example `contact.test.ts`.

## API & Configuration Notes
Support `CORS_ALLOW_ORIGIN`, defaulting to `https://thanejoss.com`, and allow future comma-separated values. Keep `services` and `apps` static in v1 unless storage is intentionally introduced. The API should expose `GET /api/health`, `GET /api/services`, `GET /api/apps`, and `POST /api/contact`. The `contact` endpoint may stub queueing, but it must validate `name`, `email`, and `message` and return a queued receipt with `submissionId`, `receivedAt`, and `status`.

## Commit & Pull Request Guidelines
No project history is available in this workspace, so use short imperative commit messages such as `Add contact route validation`. PRs should list tested endpoints, include example requests or responses for changed contracts, and note any env vars or deployment assumptions.

Match the owner's required workflow:

- Never push directly to `main` unless explicitly instructed.
- Create a dedicated branch for each task, using names such as `feat/contact-delivery` or `fix/cors-origin`.
- Make focused commits with conventional-style prefixes when appropriate, for example `feat: add queued contact receipt`.
- After changes, run the relevant verification commands before pushing.
- Push the branch to `origin` and then open a PR against `main`; do not stop after only pushing the branch.
- In the PR body, include a short summary, validation steps, changed endpoints, and any environment or deployment assumptions.
- Merge only after the owner reviews it or explicitly tells you to merge despite failing checks.
