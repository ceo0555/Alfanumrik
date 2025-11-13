## Backend Service

This Express-based service provides structured REST endpoints that sit behind the Vercel functions. It shares the Neon connection with the frontend by reading the same `DATABASE_URL`.

### Local development

```bash
cd backend
npm install
DATABASE_URL="postgres://..." JWT_SECRET="super-secret" npm run dev
```

The server starts on port `4000` by default. Update `registerApiRoutes` to expose feature-specific routers.

### Key directories

- `src/routes` – feature routers (e.g. `/api/profiles`)
- `src/services` – shared infrastructure (database pool, caching, etc.)
- `src/types` – backend-specific shared types
- `src/utils` – validation and error helpers

### Environment variables

- `DATABASE_URL` – Neon connection string (required)
- `JWT_SECRET` – secret used to sign authentication tokens (required)
- `JWT_TTL` – optional token lifetime (default `1h`)
- `SERVICE_TOKEN` – optional secret expected from Vercel functions when proxying. If set, every request must include the header `x-service-token: <SERVICE_TOKEN>`.

### Building & testing

```bash
npm run build
npm test
```

CI should run `npm run backend:build` from the repository root to ensure the backend compiles before deployment.

### Database migrations

This scaffold uses plain SQL via the Neon serverless driver. For production readiness, adopt a migration framework:

- **Prisma** – `npm install prisma @prisma/client` then `npx prisma init`; manage tables with `prisma migrate`.
- **Drizzle** – `npm install drizzle-orm drizzle-kit` and define schema modules with generated SQL migrations.

Store migration artifacts under `backend/migrations/` and wire `npm run backend:migrate` (custom script) into CI/CD before deploying new code.

To run the bundled SQL migrations with `psql`:

```bash
npm run migrate:sql
```

> Note: `psql` must be available on your PATH.

### Interaction event logging

Use the `POST /api/events` endpoint to log detailed student interactions:

```json
{
  "event": {
    "userId": "c4b05c66-4ef2-4c65-b49d-3e21b7aa9948",
    "profileId": 101,
    "eventType": "quiz_submitted",
    "contentId": "math-7-fractions-quiz-1",
    "skillIds": ["fractions.reduction", "fractions.addition"],
    "success": true,
    "score": 0.82,
    "durationMs": 34000,
    "payload": { "questionId": "math-7-fractions-quiz-1-q3" },
    "occurredAt": "2025-01-01T12:34:56Z"
  }
}
```

Events populate the `interaction_events` table and power mastery-model training, analytics, and recommendation engines.

