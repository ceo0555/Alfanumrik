## Pilot Readiness & Scalability Assessment

### Current State (2025-11-12)
- **Frontend only**: The React/Vite client depends entirely on browser `localStorage` via `services/apiService.ts`, which is unsuitable for multi-user scenarios or synchronized classrooms.
- **Event-driven refresh**: `appEventBus` rebroadcasts `data-changed` events and triggers full data reloads. This works locally but will produce heavy network load when scaled.
- **AI dependencies**: Gemini APIs drive lesson creation, remediation, grading, and analytics. Robust error handling, retries, and quotas will be essential for production stability.
- **Authentication / RBAC**: Mocked using context; no real auth provider, session management, or multi-tenant guardrails.
- **Testing & CI**: No automated tests beyond build. No monitoring, logging, or release pipelines.

Given the above, the app is **not pilot ready** for a real classroom deployment.

---

### Minimum Requirements for a Limited Pilot
1. **Persistent Backend**
   - Introduce a managed database (e.g., Postgres on Supabase, PlanetScale, or Firebase/Firestore).
   - Replace `apiService.ts` localStorage implementations with REST/GraphQL endpoints (CRUD for profiles, assignments, submissions, analytics, etc.).
   - Add optimistic update handling, stale-while-revalidate caching (React Query/SWR), and conflict resolution.

2. **Authentication & Authorization**
   - Adopt an auth provider (e.g., Supabase Auth, Auth0, Firebase Auth) with role-based access control.
   - Secure Gemini API interactions on the server to avoid exposing API keys in the client bundle.

3. **Operational Visibility**
   - Add telemetry/logging (e.g., Sentry for frontend errors, Datadog/New Relic for backend).
   - Implement feature flags to toggle Gemini-powered experiences when quotas or latency issues arise.

4. **Testing & QA**
   - Establish automated UI/unit tests (Vitest/Jest, Playwright/Cypress).
   - Setup CI pipeline (GitHub Actions) to run lint/build/test on pull requests.

5. **Content Controls**
   - Cache Gemini outputs in the backend, attach version metadata, allow manual review/approval before student consumption.

---

### Scaling Path to 5,000 Daily Active Users

| Area | Immediate Actions | Scaling Enhancements |
| --- | --- | --- |
| **Architecture** | Split the monolithic contexts into feature slices; adopt React Query to manage asynchronous server state. | Migrate to modular microservices (content generation, analytics, engagement) behind an API gateway. |
| **Backend** | Choose a managed Postgres/SQL store or scalable NoSQL (Firestore/Dynamo). Implement data access layers and migrations. | Enable read replicas, caching (Redis/Upstash), and background workers (BullMQ/Celery) for long-running Gemini jobs. |
| **AI Latency & Quotas** | Queue Gemini requests via backend (e.g., Cloud Tasks, AWS SQS). Cache outputs indexed by topic/user to avoid regen. | Add dynamic rate limiting, fallback content pools, and short-term CDN (Cloudflare) for static lesson assets. |
| **Deployment** | Containerize frontend & backend (Docker) with infra-as-code (Terraform). Host on Vercel/Render/Heroku (pilot) before moving to Kubernetes or ECS. | Move to regional deployments, integrate service mesh/observability stack (OpenTelemetry + Grafana/Prometheus). |
| **Reliability** | Add health-check endpoints, graceful degradation (serve cached lesson packs), and circuit breakers around Gemini calls. | Implement chaos testing, auto-healing infra, disaster recovery backups, and data retention policies. |
| **Security & Compliance** | Enforce HTTPS, JWT validation, role-based access control, audit logs for educator actions. | Conduct penetration testing, comply with FERPA/GDPR, encrypt data at rest/in transit, rotate keys automatically. |

---

### Suggested Implementation Roadmap
1. **Week 1-2:** Stand up backend service (Supabase/Firebase) and migrate profile/assignment storage.
2. **Week 3:** Integrate auth provider + secure Gemini proxy endpoint; add React Query for client data.
3. **Week 4:** Implement telemetry (Sentry + Logtail) and basic CI (GitHub Actions).
4. **Week 5-6:** Add feature gating, offline cache for Gemini content, and content moderation dashboard.
5. **Week 7+:** Load testing (k6/Gatling), autoscaling policies, failover drills, and security hardening.

---

### Key Technical Debt to Resolve Early
- **Data Schema Drift**: Centralize type definitions between frontend/backend (zod schemas or OpenAPI).
- **Monolithic Contexts**: Break out `AuthContext` into composable providers to avoid re-render storms.
- **Hard-coded Assets**: Ensure all lesson media, video URLs, and generated content are served from a CDN/storage bucket rather than embedded constants.
- **Manual AI Calls**: Wrap Gemini interactions with retry/back-off policies and persistent logging to trace failures.

Addressing the above will help shift the codebase from prototype to a pilot-ready platform capable of handling 5,000 concurrent student sessions with resilience and observability.
