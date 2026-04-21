# Repository Guidelines

## Project Structure & Module Organization
This repository is for a provider-agnostic JSON API behind `https://api.thanejoss.com/api`. Preserve the `/api` route prefix exactly and keep the implementation free of Cloudflare-only bindings. As code is added, place HTTP handlers in `src/routes/`, shared response and validation helpers in `src/lib/`, and any future static payloads in `src/data/`. Put tests under `tests/` or next to source files as `*.test.ts`.

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

- `GET /api/health` returning `200`
- `POST /api/contact` returning `202` for valid payloads
- `400` cases for invalid JSON and validation failures
- `404` for unknown `/api` routes
- CORS behavior for `https://thanejoss.com`

Name tests after the route or behavior they verify, for example `contact.test.ts`.

## API & Configuration Notes
Support `CORS_ALLOW_ORIGIN`, defaulting to `https://thanejoss.com`, and allow future comma-separated values. The API should expose `GET /api/health` and `POST /api/contact`. The `contact` endpoint may stub queueing, but it must validate `name`, `email`, and `message` and return a queued receipt with `submissionId`, `receivedAt`, and `status`.

## Commit & Pull Request Guidelines
Apply the global Git workflow defaults from `~/.codex/AGENTS.md`, then follow these repository-specific additions:

- Prefer branch names that match the API work, such as `feat/contact-delivery` or `fix/cors-origin`.
- Push the task branch to `origin` and then open a PR against `dev`; do not stop after only pushing the branch.
- If there is no open `dev` to `main` PR, create one so `dev` can be merged into `main` at any time.
- In this repository, PRs should clearly list tested endpoints and include example requests or responses for changed contracts.
