# API endpoints

The backend routes live under `/api`. The request and response payloads below match the shared contracts in `packages/contracts`.

## Create poll

- `POST /api/polls/create`
- trims the poll name and every choice before validation
- requires at least two non-empty, unique choice names after trimming
- allows duplicate poll titles and escalates slug suffix length on collision
- success response: `200 OK`

```json
{
    "id": "poll-id",
    "slug": "team-lunch--1a2b3c4d",
    "pollName": "Team lunch",
    "choices": ["Pizza", "Ramen"],
    "createdAt": "2026-04-06T12:00:00.000Z",
    "organizerToken": "returned-once-secret-token"
}
```

- failure responses:
- `400` for invalid input such as blank trimmed names, fewer than two choices, or duplicate choice names after trimming
- `500` if every generated slug candidate is already taken

## Fetch poll

- `GET /api/polls/:pollRef`
- `pollRef` accepts either the poll UUID or the canonical public slug
- success response: `200 OK`

```json
{
    "id": "poll-id",
    "slug": "team-lunch--1a2b3c4d",
    "pollName": "Team lunch",
    "createdAt": "2026-04-06T12:00:00.000Z",
    "endedAt": "2026-04-06T13:00:00.000Z",
    "choices": ["Pizza", "Ramen"],
    "voters": ["Alice", "Bob"],
    "results": {
        "Pizza": 8.49,
        "Ramen": 6.32
    }
}
```

- result visibility rules:
- while a poll is still open, the response omits `results`
- after a poll is ended, `endedAt` is present and `results` contains the rounded geometric mean per choice
- if a poll is ended before any votes are submitted, `results` is an empty object

- failure responses:
- `404` when the poll does not exist

## Submit vote

- `POST /api/polls/:pollRef/vote`
- `pollRef` accepts either the poll UUID or the canonical public slug
- trims the voter name and vote keys before validation
- ignores unknown choice names after lookup, but rejects the request if nothing valid remains
- success response: `200 OK`

```json
"Voted successfully in vote poll-id."
```

- failure responses:
- `400` for invalid poll id, empty voter name, empty vote submission, or a submission with no valid choice names
- `404` when the poll does not exist
- `409` when the poll has already ended
- `409` when the same voter submits the same choice twice

## End poll

- `POST /api/polls/:pollRef/end`
- `pollRef` accepts either the poll UUID or the canonical public slug
- requires the organizer token returned once during poll creation
- success response: `200 OK`

```json
{
    "id": "poll-id",
    "slug": "team-lunch--1a2b3c4d",
    "pollName": "Team lunch",
    "createdAt": "2026-04-06T12:00:00.000Z",
    "endedAt": "2026-04-06T13:00:00.000Z",
    "choices": ["Pizza", "Ramen"],
    "voters": ["Alice", "Bob"],
    "results": {
        "Pizza": 8.49,
        "Ramen": 6.32
    }
}
```

- failure responses:
- `400` for a missing organizer token
- `403` when the organizer token does not match the poll
- `404` when the poll does not exist

## Health check

- `GET /api/health-check`
- success response: `200 OK`

```json
{
    "service": "OK",
    "database": "OK"
}
```
