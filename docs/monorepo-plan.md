# Monorepo preparation plan

Goal: split SvelteKit web app and a new Go API into a monorepo without breaking current deployments. This document outlines structure, migration steps, and responsibilities.

## Target structure

- apps/
  - web/  (existing SvelteKit app moved here)
  - api/  (future Go service using sqlc)
- packages/
  - shared-types/ (optional: OpenAPI types, shared JSON schemas)
- infra/
  - docker/ (compose overrides, local dev helpers)
- .github/workflows (CI/CD)
- docs/ (this plan, API contract)

## Migration steps (no code moved yet)

1) Create folders apps/, packages/, infra/ (done later when moving).
2) Move current repo contents into apps/web except top-level meta like .github, docs, license.
3) Adjust web build paths:
   - update CI to use working-directory apps/web
   - update Dockerfile location to apps/web/Dockerfile
4) Introduce a root compose.yaml to run db, minio, api, and web in dev.
5) Add CODEOWNERS and PR rules per app.

## Responsibilities

- apps/web: UI, auth (better-auth), auth DB reads/writes, uploading via API, and SSE consumption.
- apps/api: CRUD for runs, search endpoints, metrics, images upload, SSE hub (or gateway). Authn via shared secret or JWT from better-auth; no user management here.

## Versioning & releases

- CI builds and tests each app independently.
- Docker images tagged as:
  - ghcr.io/<org>/<repo>:web-<sha>, web-latest
  - ghcr.io/<org>/<repo>:api-<sha>, api-latest

## Local dev

- Single `docker compose up` to run postgres, minio, api, web.
- Web talks to API at http://api:8080.

## Open questions

- Do we keep SSE inside SvelteKit or move to Go? See API contract doc.
- Decide on auth propagation to API: basic auth (existing), service token, or user JWT.
