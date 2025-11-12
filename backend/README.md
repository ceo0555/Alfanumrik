## Backend Service

This Express-based service provides structured REST endpoints that sit behind the Vercel functions. It shares the Neon connection with the frontend by reading the same `DATABASE_URL`.

### Local development

```bash
cd backend
npm install
DATABASE_URL="postgres://..." npm run dev
```

The server starts on port `4000` by default. Update `registerApiRoutes` to expose feature-specific routers.

### Key directories

- `src/routes` – feature routers (e.g. `/api/profiles`)
- `src/services` – shared infrastructure (database pool, caching, etc.)
- `src/types` – backend-specific shared types
- `src/utils` – validation and error helpers

### Building & testing

```bash
npm run build
npm test
```

CI should run `npm run backend:build` from the repository root to ensure the backend compiles before deployment.

