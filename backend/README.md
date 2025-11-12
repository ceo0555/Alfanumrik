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
- `SERVICE_TOKEN` – optional bearer token expected from Vercel functions when proxying

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

