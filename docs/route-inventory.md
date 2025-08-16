# Route inventory (from Svelte app)

Auth remains in web via better-auth. Below lists current server routes and page actions that should be provided by the Go API (or remain in web).

## Server endpoints (SvelteKit)

- GET /api/v1/runs
  - returns Array<RunWithUser>
- POST /api/v1/runs
  - basic auth; body RunDco; emits SSE events
- POST /api/v1/runs/sse
  - SSE stream with RunCreated/RunUpdated/RunDeleted
- POST /api/v1/images
  - basic auth; Content-Type image/jpeg; Accept plain or json
- GET /api/v1/users/search?name=...&limit=...
  - returns minimal user fields for autocomplete
- GET /metrics
  - Prometheus metrics
- GET /uploads/:filename
  - dev/local only when STORAGE_PROVIDER=local (static passthrough)

## Page server actions to re-map to API

- /app/leaderboard
  - actions.updateName(id, userId) -> updates run's user assignment
  - actions.deleteRun(runId) -> delete run (admin only)
- /app/feed
  - actions.claimRun(id) -> sets userId for run to current user

Notes
- Profile pages load user stats and recent runs from DB directly today:
  - getUserStats(userId)
  - getRecentRunsForUser(userId, limit)
  These should have API equivalents if we want to remove direct DB reads in web.
