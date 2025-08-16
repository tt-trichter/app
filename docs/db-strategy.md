# Database strategy: Drizzle (web) + sqlc (api)

Goal: Keep better-auth tables and SvelteKit access via Drizzle, while introducing Go sqlc for application data (e.g., runs). Ensure both can share the same Postgres with clean ownership.

## Principles

- Single Postgres instance, separate schemas by concern:
  - auth schema (managed by better-auth + drizzle)
  - app schema (managed by sqlc migrations)
- Ownership: each service applies migrations only for its schema.

## Proposed layout

- Schema names
  - auth: public (as today) or auth
  - app: app
- Migrations
  - apps/web continues to use drizzle-kit for auth tables and any UI-owned tables.
  - apps/api owns `app` schema with goose (or migrate) SQL migrations and sqlc for queries.

## Access patterns

- Svelte (web):
  - Reads auth tables for session/user and possibly joins for display.
  - For data previously served by Svelte endpoints (runs, search), call the Go API instead of direct DB once migrated.
- Go API:
  - Owns CRUD for runs and related read models. Provides endpoints listed in API contract.

## Migration path

1) Freeze schema shape: export current Drizzle SQL (already in drizzle/*.sql). Align to final structure:
   - Move `runs` from Drizzle to Go ownership gradually.
   - Introduce `app.runs` table via migration in Go with the same columns.
2) Dual-write or cutover:
   - Short path: downtime window—rename table and re-point Svelte code to API. Since we won't change Svelte now, do the move when API is ready.
   - Safer path: create `app.runs` and a view `public.runs` that selects from `app.runs` during transition.
3) Permissions
   - Create DB roles: web_rw (web), api_rw (api). Grant on respective schemas.

## Connection strings

- Keep a single DATABASE_URL but allow schema search_path per service:
  - Web: search_path=public,auth
  - API: search_path=app,public

## sqlc tips

- Place `sqlc.yaml` in apps/api, target package `internal/db`.
- Write SQL in `db/queries/*.sql`, migrations in `db/migrations/*.sql`.
- Prefer explicit columns; align JSON shapes to Svelte types.

## Better-auth integration

- Web continues to manage users/sessions.
- If API needs to act on behalf of a user, pass JWT from web to API. Otherwise use service token for ingestion (current basic auth can remain or be replaced by a static bearer token env var).
