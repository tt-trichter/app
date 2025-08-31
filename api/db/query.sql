-- name: GetRuns :many
SELECT id, user_id, data, created_at, image FROM runs
ORDER BY created_at DESC;

-- name: SaveRun :one
INSERT INTO runs (user_id, data, image, created_at)
VALUES ($1, $2, $3, NOW())
RETURNING id, user_id, data, created_at, image;

-- name: GetAllRunsWithUsers :many
SELECT 
    r.id, 
    r.user_id, 
    r.data, 
    r.image, 
    r.created_at,
    u.id as user_id_full,
    u.name as user_name,
    u.username as user_username
FROM runs r
LEFT JOIN "user" u ON r.user_id = u.id
ORDER BY (r.data->>'rate')::float DESC;

-- name: UpdateRunWithUser :one
UPDATE runs 
SET user_id = $2
WHERE id = $1
RETURNING id, user_id, data, created_at, image;

-- name: DeleteRun :exec
DELETE FROM runs WHERE id = $1;

-- name: GetRunsByUserId :many
SELECT id, user_id, data, created_at, image 
FROM runs 
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetRecentRunsForUser :many
SELECT id, user_id, data, created_at, image 
FROM runs 
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: GetUserById :one
SELECT id, name, username 
FROM "user" 
WHERE id = $1;

-- name: SearchUsersByName :many
SELECT id, name, username, display_username
FROM "user"
WHERE name ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%'
ORDER BY name
LIMIT $2;
