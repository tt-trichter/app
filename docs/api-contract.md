# API contract (candidate) for Go service

Auth remains in Svelte (better-auth). The API is stateless and trusts requests authenticated via:
- Basic auth for ingestion (current behavior), or
- Service token in `Authorization: Bearer <token>`, or
- End-user JWT issued by better-auth (optional future).

## Runs
- GET /api/v1/runs
  - Response: 200 application/json
    - Array<RunWithUser>
- POST /api/v1/runs
  - Auth: Basic or Bearer token
  - Body: RunDco
  - Response: 200 { success: true } | 400 validation | 500

## Runs SSE
- POST /api/v1/runs/sse
  - Server-Sent Events stream emitting events:
    - event: RunCreated | RunUpdated | RunDeleted
    - data: RunWithUser or { id: string }

## Images
- POST /api/v1/images
  - Auth: Basic or Bearer
  - Content-Type: image/jpeg
  - Accept: text/plain (returns path) or application/json
  - Response: 200 string | { resource: string } | 415 | 500

## Users search
- GET /api/v1/users/search?name=<q>&limit=<n>
  - Response: 200 Array<{ id, name, username, displayUsername }>

## Metrics
- GET /metrics
  - Response: 200 text/plain (Prometheus)

## Uploads (dev/local only)
- GET /uploads/:filename
  - Only when STORAGE_PROVIDER=local; otherwise 404. Used to proxy local files.

## Types (from Svelte app today)
- RunDco: { duration: number; rate: number; volume: number; image: string }
- RunWithUser: Run & { user?: { id: string; name: string; username: string } | null }

Notes
- Preserve response shapes to avoid frontend changes during the split.
- Errors: use JSON body `{ success: false, error: string, details?: any }` with appropriate status.
