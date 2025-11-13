## Adaptive Backend Architecture

### Overview

The adaptive learning stack should operate as a feedback loop:

1. **Event ingestion**  
   - Client and server components call `POST /api/events` with every learner interaction (question submissions, hint usage, lesson completion).  
   - Events land in the `interaction_events` table and are mirrored to analytics storage (e.g., BigQuery, Snowflake) via change-data-capture.

2. **Mastery modeling service**  
   - A background worker consumes events, updates learner state in a dedicated `learner_mastery` table, and triggers recommendations.  
   - The worker is pluggable: swap in DKT, AKT, or transformer-based KT without touching the ingest API.

3. **Recommendation engine**  
   - REST endpoints (e.g., `GET /api/recommendations/:profileId`) return prioritized activities using the latest mastery snapshot.  
   - The engine is feature-flagged so we can deploy new models to a subset of students.

4. **Content dispatch**  
   - The frontend pulls recommended activities and adjusts lesson flow in real time (difficulty, pacing, remediation bundles).

### Proposed components

| Component | Responsibility | Deployment |
| --- | --- | --- |
| `interaction-events` API | Write interaction events, expose filtered reads for analytics | Express backend |
| Queue (e.g., AWS SQS, RabbitMQ, Vercel Cron) | Buffer events for async processing | Managed service |
| Worker (`adaptive-worker`) | Consume events, update mastery vectors, queue recommendations | Node service / serverless job |
| Recommendation API | Serve ordered activity lists to the UI | Express backend |
| Feature flag service (LaunchDarkly/GrowthBook) | Gradually enable new models or interventions | SaaS |

### Data flow

```
Client -> Vercel Function (proxy) -> Express Backend -> Neon (interaction_events)
                                     ↓
                                  Event Queue
                                     ↓
                              Adaptive Worker -> Neon (learner_mastery, recommendations)
                                     ↓
                            Recommendation API -> Client
```

### Observability

- All services emit structured logs with correlation IDs (`sessionId`, `eventId`).  
- Metrics: event throughput, worker latency, recommendation acceptance rate.  
- Alerts: backlog growth in queue, model errors, stale mastery snapshots.

This architecture isolates ingest, modeling, and delivery layers so we can iterate on adaptive algorithms without impacting the client contract.
