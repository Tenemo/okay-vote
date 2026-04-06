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
    "createdAt": "2026-04-06T12:00:00.000Z"
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
    "choices": ["Pizza", "Ramen"],
    "voters": ["Alice", "Bob"],
    "results": {
        "Pizza": 8.49,
        "Ramen": 6.32
    }
}
```

- result visibility rules:
- before two distinct voters submit, the response omits `results`
- after two or more distinct voters submit, `results` contains the rounded geometric mean per choice

- failure responses:
- `404` when the poll does not exist

## Submit vote

- `POST /api/polls/:pollId/vote`
- `pollId` must be a UUID, not a slug
- trims the voter name and vote keys before validation
- ignores unknown choice names after lookup, but rejects the request if nothing valid remains
- success response: `200 OK`

```json
"Voted successfully in vote poll-id."
```

- failure responses:
- `400` for invalid poll id, empty voter name, empty vote submission, or a submission with no valid choice names
- `404` when the poll does not exist
- `409` when the same voter submits the same choice twice

## Health check

- `GET /api/health-check`
- success response: `200 OK`

```json
{
    "service": "OK",
    "database": "OK"
}
```
