# Mock API server

Tiny Express server that serves `/api/companies` and `/api/departments` with the
same `PageRequest` → `PageResponse` contract the client uses.

## Run

```bash
npm run server          # API only on :4000
npm run dev             # API + Vite together (Vite proxies /api → :4000)
```

## Query shape

```
GET /api/companies
  ?pageIndex=0
  &pageSize=10
  &keyword=acme
  &sort=code:asc
  &sort=name:desc
  &filter=status:ACTIVE
  &filter=companyId:c1
```

- `keyword` → contains-string match across configured searchable fields
- `filter=field:value` → strict equality (repeatable)
- `sort=field:asc|desc` → multi-column, leftmost is primary

## Endpoints

| Method | Path                       | Body          | Returns                  |
|--------|----------------------------|---------------|--------------------------|
| GET    | /api/companies             | —             | `{ items, total }`       |
| GET    | /api/companies/:id         | —             | item                     |
| POST   | /api/companies             | partial       | created (201)            |
| PUT    | /api/companies/:id         | partial       | updated                  |
| PATCH  | /api/companies/:id         | partial       | updated                  |
| DELETE | /api/companies/:id         | —             | 204                      |
| GET    | /api/health                | —             | health snapshot          |

`/api/departments/*` mirrors the same shape.

State lives in memory and resets when the server restarts.
