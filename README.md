# Dynamic Form Builder Engine

> Full-Stack Developer Technical Assessment — Assignment A

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- A [Neon](https://neon.tech) account (free tier is sufficient)

### 1. Set up the database

Create a new project in [Neon](https://neon.tech). Copy the connection string from the dashboard and add it to a `.env` file at the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
```

### 2. Install dependencies

```bash
npm install
```

### 3. Generate Prisma client & run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js (App Router)                                  |
| Styling    | Tailwind CSS                                          |
| Database   | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM        | Prisma                                                |
| Validation | AJV (dynamic) + Zod (static shapes)                   |

---

## Project Structure

```
app/
  api/forms/          # REST API routes (see below)
  forms/              # UI pages — list, detail, fill, submissions, versions
components/
  dashboard/          # ActivityFeed, FormCard, FormList, HeroSection, NavBar, StatsGrid
  form-renderer/      # FormListItem, FormRenderer
  ui/                 # Shared UI primitives
lib/                  # ajv, api client, dashboard helpers, prisma singleton
modules/
  form-template/      # Repository + service + types
  submission/         # Repository + service + types
  validation/         # Validation service (AJV wrapper)
types/                # Shared TypeScript types
tests/
  unit/               # validation.service, version-immutability
  integration/
```

---

## API Endpoints

| Method | Path                                        | Description                                 |
| ------ | ------------------------------------------- | ------------------------------------------- |
| GET    | `/api/forms`                                | List all form templates                     |
| POST   | `/api/forms`                                | Create a new form template                  |
| GET    | `/api/forms/:id`                            | Get a form template with its latest version |
| POST   | `/api/forms/:id/versions`                   | Publish a new version of a form             |
| GET    | `/api/forms/version/:versionId`             | Get a specific form version                 |
| POST   | `/api/forms/version/:versionId/submissions` | Submit a form response                      |
| GET    | `/api/forms/version/:versionId/submissions` | List submissions for a version              |

---

## Data Model

```
FormTemplate
  id, name, createdAt, updatedAt
  └── FormVersion (many)
        id, versionNumber, schema (JSONB), isLatest, createdAt
        └── Submission (many)
              id, payload (JSONB), createdAt
```

**Key design decisions:**

- Submissions point to `FormVersion`, not `FormTemplate` — historical integrity is preserved even when new versions are published.
- `FormVersion.schema` is stored as JSONB (Postgres) — the full JSON Schema is retrieved at runtime and fed to AJV for dynamic validation. No field rules are hardcoded in application code.
- `@@unique([formTemplateId, versionNumber])` prevents duplicate version numbers at the database level.
- `isLatest` flag makes "get current form" a single indexed query without a subquery.
- New versions are created inside a Prisma transaction: old `isLatest` is unset and new record is created atomically.

---

## Validation Strategy

| Concern                                                        | Tool              | Why                                                                                    |
| -------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| Dynamic payload validation (user submissions vs stored schema) | AJV + JSON Schema | Purpose-built for this; fast; supports full draft-07 including formats, enums, min/max |
| Static API request shape validation                            | Zod               | TypeScript-first; infers types; clean error messages                                   |

These two tools have a hard boundary — they are never used for each other's job.

---

## Trade-offs

- **No auth** — the assessment does not require it for Assignment A. A production version would add JWT/session auth and scope form management to authenticated users.
- **No pagination** on list endpoints — acceptable for a prototype; would add cursor-based pagination for production.
- **JSONB vs separate field tables** — chose JSONB for true dynamism. A relational field table would give stronger referential integrity but would require schema migrations for every form change, defeating the purpose of a dynamic engine.
- **isLatest flag vs MAX(versionNumber)** — a flag is one index read vs an aggregate; fast and explicit.
- **Tailwind CSS** — utility-first styling keeps component styles co-located and removes the need for separate CSS modules. `globals.css` only contains the Tailwind directives; all other styles are applied via class names.
- **Neon instead of a local Docker database** — the spec asks for a containerised setup or a straightforward alternative. Using Neon removes the Docker dependency entirely: there is nothing to containerise locally, and a reviewer can get a working database in under a minute by pasting a connection string into `.env`. It also means the same `DATABASE_URL` works identically in local dev and the hosted deployment with no environment-specific config. The trade-off is a dependency on a third-party service rather than a fully self-contained repo; in a production project, Docker Compose would still be provided as a local fallback.

## What I would add with more time

- **Auth (NextAuth.js or Clerk)** — scope form creation and version publishing to authenticated users; submissions can remain public or gated depending on the form. Role-based access (admin vs respondent) would protect the management endpoints while keeping the fill-in experience open.

- **AI-assisted schema generation** — expose a prompt-to-schema endpoint that takes a natural language description (e.g. *"a job application with name, email, years of experience as a number, and a CV upload"*) and returns a valid JSON Schema using an LLM (Claude or GPT-4o). The output is treated as a draft — the user reviews and publishes it as a new `FormVersion`. This keeps the human in the loop while removing the need to hand-write JSON Schema. The validation pipeline is unchanged: whatever schema is stored gets fed to AJV regardless of how it was produced.

- **Form designer UI** — drag-and-drop field builder as a visual alternative to the AI prompt; produces the same JSON Schema output and goes through the same publish flow.

- **Submission review view** — admin-facing table to browse, filter, and export responses per version.

- **Pagination and filtering** on list endpoints — cursor-based pagination for submissions; filter by date range or version.

- **Rate limiting** on the submission endpoint to prevent abuse.

- **E2E tests** (Playwright) covering the fill → submit → confirmation flow.

---

## AI Tool Usage

<!-- Fill this in per the assessment requirement -->
- **Tools:** Claude (Anthropic), ChatGPT (OpenAI)
- **Used for:** Initial folder structure scaffold, boilerplate route stubs, README template
- **Verified:** All logic (validation flow, transaction strategy, schema design) was reviewed and understood line by line before committing.

---

## Error Handling

All API routes follow a consistent envelope pattern:

**Success**
```json
{ "data": { ... } }
```

**Error**
```json
{ "error": "Human-readable message" }
```

| Status | Trigger                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| `200`  | Successful GET                                                                                               |
| `201`  | Successful POST (resource created)                                                                           |
| `400`  | Request body fails Zod schema validation (malformed shape or missing required fields)                        |
| `404`  | Referenced resource (`FormTemplate`, `FormVersion`) does not exist                                           |
| `422`  | Submission payload fails AJV validation against the stored JSON Schema (field-level errors returned in body) |
| `500`  | Unexpected server or database error — logged server-side, generic message returned to client                 |

Where a route needs multiple independent reads (e.g. `GET /api/forms/:id` fetches the template and its versions in parallel), `Promise.all` is used to avoid sequential round-trips to the database.

Zod and AJV errors are the only place field-level detail is surfaced to the client. All other errors return a single `error` string to avoid leaking internal implementation details.

---

## Scaling to Production

The architecture is deliberately simple for a prototype, but each layer has a clear upgrade path:

**API layer**
- The Next.js API routes are stateless and horizontally scalable behind a load balancer (e.g. via Vercel's edge network or ECS/Fargate tasks).
- Rate limiting on the submission endpoint (e.g. via an API gateway or a Redis-backed middleware like `@upstash/ratelimit`) would be the first addition under real traffic.

**Database**
- Neon is used for the prototype (serverless Postgres with instant branching, useful for spinning up isolated test environments). Under production load, the read-heavy routes (`GET /api/forms`, `GET .../submissions`) move to a read replica — Neon supports read replicas natively — while writes stay on the primary.
- Prisma connection pooling should be replaced with PgBouncer or [Prisma Accelerate](https://www.prisma.io/accelerate) in a serverless environment to avoid connection exhaustion (each cold-start opening a new connection).

**Submission ingestion**
- For high-volume forms, `POST .../submissions` can be decoupled from synchronous Postgres writes by publishing to a queue (SQS, BullMQ) and consuming asynchronously. This keeps p99 response times low and prevents a write spike from blocking reads.
- AJV validation still runs synchronously before enqueue so invalid submissions are rejected immediately.

**Schema / versioning**
- `FormVersion.schema` is stored as JSONB. At scale, cold reads of large schemas could be cached in Redis with a short TTL (keyed by `versionId`, which is immutable once published).

**Observability**
- Add structured logging (e.g. Pino) to replace `console.error`, feed into a log aggregator (Datadog, Loki), and set up alerting on 5xx rate and p95 submission latency.

---

## Running Tests

```bash
npm test
```

```bash
npm test -- --coverage
```