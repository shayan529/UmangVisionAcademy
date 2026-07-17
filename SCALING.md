# Umang Vision Academy: Scaling Plan (Current State)

Reflects the architecture decisions made so far, not the original AWS/ECS blueprint. Frontend and backend both run on Vercel — that's the one fact that reshapes almost everything below. Items are marked **[Decided]** (the plan is set, implementation may still be in progress) or **[Open]** (not yet decided).

---

## 0. Fixed / In Progress

- **MongoDB IP whitelist:** was `0.0.0.0/0` — needs restricting to Vercel's outbound ranges or the Atlas Vercel integration. **[Action item, not yet confirmed done.]**
- **Mongoose connection caching:** Vercel functions can exhaust Atlas connections if each cold invocation opens a new one. Fix is to cache the connection at module scope so warm invocations reuse it. **[Included in the BullMQ/worker implementation prompt — verify it lands.]**
- **Media storage:** staying on self-hosted Multer + Cloudflare Tunnel for now. **Not** migrating to Cloudflare R2 currently. This remains a known risk (single point of failure, bandwidth-limited, disk-based rather than object storage) but is out of scope for the current work.

---

## 1. Frontend & Client-Side Optimizations

Unchanged from the original plan — none of this depends on backend hosting choice.

- **Vite code splitting** via `React.lazy()`/`Suspense` so students don't download Admin/Instructor bundles.
- **Edge caching** on Vercel for static assets, aggressive `Cache-Control` headers on hashed files.
- **ImageKit** for thumbnails/slides/profile pictures (resizing, WebP/AVIF).
- **Capacitor WebView caching** for the Android APK wrapper, to avoid re-fetching static assets over cellular.
- **Offline fallbacks** via service workers for translation JSON and core styles.

## 2. Backend — Vercel Serverless (Not PM2/ECS)

The original PM2-clustering / AWS ECS / ALB section doesn't apply — Vercel handles autoscaling per-request automatically. What replaces it:

- No manual cluster config needed.
- Function duration limits apply (10s Hobby / up to 300s Pro) — anything longer must be queued, not run inline.
- **[Decided]** Long-running work (grading, bulk imports, notifications, media processing) moves to a background job system rather than executing inside API routes — see BullMQ section below.
- Rate limiting (`express-rate-limit` + `rate-limit-redis`) stays as originally specified: 200 req/15min general, 10/15min on `/api/auth/*`, 30/min on `/api/ai/*`.

## 3. Real-Time (Socket.IO) — [Decided]

Socket.IO does not run inside Vercel functions as the primary path. **Decision: move it to its own small always-on service** (Railway/Fly.io/VM), separate from the Vercel deployment, sharing the same MongoDB and Redis. Frontend points its socket client at a dedicated `VITE_SOCKET_URL`.

Performance guidelines for that service, once built:
- **Room-scoped events only** — broadcast to a class/session room, never platform-wide, so fanout cost scales with session size, not total users.
- **Thin payloads** — sockets carry deltas (chat messages, status changes, incremental rank updates); full state loads via normal REST on connect.
- **Non-blocking writes** — broadcast first, persist through the BullMQ queue rather than synchronously writing on the hot path.
- **`@socket.io/redis-adapter`** wired in from day one, even on a single instance, so a second instance can be added later with no rework.
- **Per-connection rate limiting** on chat/message events.
- **Connection resiliency** as originally specified — `maxDisconnectionDuration: 2 * 60 * 1000`, `pingTimeout: 20000`, `pingInterval: 25000` — tuned for mobile users on variable 4G.
- **[Status: architecture decided, service not yet built.]**

## 4. Database Layer

Mostly unchanged from the original plan:

```javascript
studentActivitySchema.index({ studentId: 1, createdAt: -1 });
courseSchema.index({ class: 1, subject: 1, status: 1 });
sessionSchema.index({ classId: 1, startTime: 1 });
```

- `readPreference=secondaryPreferred` for dashboard/catalog reads once on a paid Atlas tier with replicas.
- **Real bottleneck is write bursts** (mock-test submission spikes, ranking recompute), not steady-state reads — this is what the BullMQ queueing below is actually for, more than raw scale.

## 5. Caching

Cache-aside pattern retained for course catalogs, leaderboards, and public reference papers. **Upstash Redis** as the provider — natural fit for a Vercel-based stack, and shared by both the socket service and the job queue below.

## 6. Background Jobs (BullMQ) — [Decided]

Producers (enqueueing) live inside the Vercel API. The **worker** (the process consuming jobs) cannot run inside a Vercel function — it's a separate persistent Node service, deployed alongside the Socket.IO service (same host is fine).

Queues specified for implementation:
- **`mock-test-grading`** — triggered on submission; grades, then enqueues `ranking-update` rather than recomputing inline.
- **`ranking-update`** — batched/debounced so a burst of submissions doesn't trigger a full recompute per submission.
- **`bulk-import`** — Excel-based student/instructor enrollment; reports progress via `job.updateProgress` so the frontend polls instead of holding a request open.
- **`notifications`** — email (nodemailer) and SMS (Fast2SMS) sends, including the 10-minutes-before-live-class reminder, using BullMQ's built-in delayed jobs instead of a separate cron system.

All queues: exponential backoff, 3 retry attempts, de-duplication where relevant. A Bull Board (or equivalent) dashboard, behind basic auth, gives queue-depth/failed-job visibility.

- **[Status: implementation prompt written and handed off; verify against the plan above once built — particularly that the worker is not deployed as a Vercel function.]**

## 7. Monitoring

Sentry (frontend + backend) for error tracking, structured logging, P95 latency and error-rate alerting. Datadog/New Relic held off for now — premature until the socket/worker service is running and worth monitoring as its own thing.

---

## Staged Roadmap

| Stage | Trigger | Priority actions |
|---|---|---|
| **Now** | — | Mongo IP whitelist fix; connection caching; stand up the Socket.IO + BullMQ worker service |
| **Growth** | Live classes regularly hit low hundreds concurrent, or exam submissions cause visible lag | Upstash Redis caching live; Bull Board monitoring in place; confirm room-scoped socket events are actually enforced |
| **Scale-up** | Consistent low-thousands concurrent | Atlas dedicated cluster with read replicas; second Socket.IO instance (Redis adapter already wired) |
| **Enterprise** | Tens of thousands concurrent, sustained | Revisit whether Vercel + small worker/socket VM still holds, or whether the original ECS/multi-region topology becomes relevant |

---

## Open Questions

- Exact hosting target for the worker/socket service (Railway vs. Fly.io vs. VM) — not yet finalized.
- Whether/when to revisit the Multer → object-storage (R2 or otherwise) migration.