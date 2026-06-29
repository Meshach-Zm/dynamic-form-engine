# 🧩 Dynamic Form Builder Engine

> Full-Stack Developer Technical Assessment — Assignment A

A full-stack engine for creating, versioning, and submitting dynamic forms — built with Next.js, Prisma, and AJV. Form schemas are stored as JSONB and validated at runtime, so any JSON Schema becomes a live form with zero code changes.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Postgres](https://img.shields.io/badge/PostgreSQL-Neon-00E5BF?logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Vitest-28%20tests-6E9F18?logo=vitest)

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) account (free tier is sufficient)

### 1. Set up the database

Create a new project in [Neon](https://neon.tech) and add a `.env` file at the project root:

```env
# ------------------------------------------------------------------------------
# DATABASE: NEON (PostgreSQL)
# ------------------------------------------------------------------------------
# Use the "Pooled" connection string — best for serverless (Vercel/Lambda).
# Append ?pgbouncer=true if you hit connection limits.
DATABASE_URL="postgresql://user:password@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Use the "Direct" connection string for migrations (npx prisma migrate dev).
DIRECT_URL="postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# ------------------------------------------------------------------------------
# STORAGE: CLOUDINARY
# ------------------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: folder where uploaded files are stored in Cloudinary
CLOUDINARY_FOLDER=form_uploads
```

> Both connection strings come from the Neon dashboard — **Pooled** for the app, **Direct** for migrations.

### 2. Install dependencies

```bash
npm install
```

### 3. Generate Prisma client & run migrations

Prisma uses `DIRECT_URL` for migrations (bypassing PgBouncer):

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

## 🛠 Tech Stack

| Layer       | Technology                                            |
| ----------- | ----------------------------------------------------- |
| Framework   | Next.js (App Router)                                  |
| Styling     | Tailwind CSS                                          |
| Database    | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM         | Prisma                                                |
| Validation  | AJV (dynamic) + Zod (static shapes)                   |
| File Upload | Cloudinary                                            |
| Caching     | SWR                                                   |
| Testing     | Vitest                                                |

---

## 📁 Project Structure

```
src/
  app/
    api/forms/
      [id]/
        route.ts
        submissions/route.ts
        versions/
          [versionId]/
            route.ts
            submissions/route.ts
          route.ts
      route.ts
    forms/
      [id]/
        fill/page.tsx
        page.tsx
        submissions/page.tsx
        versions/
          [versionId]/page.tsx
      versions/
        [versionId]/
          submissions/page.tsx
      new/page.tsx
      page.tsx
    globals.css
    layout.tsx
    not-found.tsx
    page.tsx

  components/
    dashboard/
      ActivityFeed.tsx
      FormCard.tsx
      FormList.tsx
      HeroSection.tsx
      NavBar.tsx
      StatsGrid.tsx
    form-renderer/
      FormRenderer.tsx
    shell/
      SideBar.tsx
    ui/
      LoadingSpinner.tsx
      Pagination.tsx

  lib/
    ajv.ts
    api.ts
    cloudinary.ts
    dashboard.ts
    date.ts
    fetcher.ts
    hooks/
      useForms.ts
    prisma.ts

  modules/
    form-template/
      form-template.repository.ts
      form-template.service.ts
      form-template.types.ts
    submission/
      submission.repository.ts
      submission.service.ts
      submission.types.ts
    validation/
      validation.service.ts

  tests/
    integration/api/
      connection.test.ts
      forms.test.ts
      submissions.test.ts
    setup/
      test-setup.ts
      vitest-setup.ts
    unit/
      validation.service.test.ts
      version-immutability.test.ts

  types/
    form.ts
    index.ts
```

---

## 🔌 API Endpoints

| Method | Path                                             | Description                                 |
| ------ | ------------------------------------------------ | ------------------------------------------- |
| GET    | `/api/forms`                                     | List all form templates                     |
| POST   | `/api/forms`                                     | Create a new form template                  |
| GET    | `/api/forms/:id`                                 | Get a form template with its latest version |
| POST   | `/api/forms/:id/versions`                        | Publish a new version of a form             |
| GET    | `/api/forms/:id/versions/:versionId`             | Get a specific form version                 |
| POST   | `/api/forms/:id/versions/:versionId/submissions` | Submit a form response                      |
| GET    | `/api/forms/:id/submissions`                     | Get all submissions for a form (paginated)  |

---

## 🗄 Data Model

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
- `FormVersion.schema` is stored as JSONB — the full JSON Schema is retrieved at runtime and fed to AJV for dynamic validation. No field rules are hardcoded in application code.
- `@@unique([formTemplateId, versionNumber])` prevents duplicate version numbers at the database level.
- `isLatest` flag makes "get current form" a single indexed query without a subquery.
- New versions are created inside a Prisma transaction: old `isLatest` is unset and the new record is created atomically.

---

## ✅ Validation Strategy

| Concern                                                        | Tool              | Why                                                                                    |
| -------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| Dynamic payload validation (user submissions vs stored schema) | AJV + JSON Schema | Purpose-built for this; fast; supports full draft-07 including formats, enums, min/max |
| Static API request shape validation                            | Zod               | TypeScript-first; infers types; clean error messages                                   |

These two tools have a hard boundary — they are never used for each other's job.

---

## 📎 File Upload

The engine supports file uploads using Cloudinary.

### Schema Configuration

```json
{
  "resume": {
    "type": "file",
    "format": "file",
    "title": "Upload Resume",
    "accept": ".pdf,.doc,.docx"
  },
  "verificationDocs": {
    "type": "array",
    "items": {
      "type": "string",
      "format": "data-url"
    }
  }
}
```

### Features

- Single file upload
- Multiple file upload (array)
- PDF viewing in browser (with proper Content-Type)
- Download option for all files
- File metadata stored (name, size, type, URL)

---

## ⚙️ Performance Optimizations

### Client-side Caching (SWR)

- Forms and submissions data cached with 1-minute deduplication
- Automatic revalidation on focus/reconnect

### API Caching

- `Cache-Control: s-maxage=60, stale-while-revalidate=300` headers

### Reduced API Calls

- Unified submissions endpoint: `/api/forms/:id/submissions` replaces N+1 calls per version
- Pagination on list endpoints (10 items per page)

---

## ⚖️ Trade-offs

- **No auth** — the assessment does not require it for Assignment A. A production version would add JWT/session auth and scope form management to authenticated users.
- **No pagination** on list endpoints — acceptable for a prototype; would add cursor-based pagination for production.
- **JSONB vs separate field tables** — chose JSONB for true dynamism. A relational field table would give stronger referential integrity but would require schema migrations for every form change, defeating the purpose of a dynamic engine.
- **isLatest flag vs MAX(versionNumber)** — a flag is one index read vs an aggregate; fast and explicit.
- **Tailwind CSS** — utility-first styling keeps component styles co-located and removes the need for separate CSS modules. `globals.css` only contains the Tailwind directives; all other styles are applied via class names.
- **Neon instead of a local Docker database** — removes the Docker dependency entirely; a reviewer can get a working database in under a minute by pasting a connection string into `.env`. The same `DATABASE_URL` works identically in local dev and on deployment. The trade-off is a dependency on a third-party service; in a production project, Docker Compose would still be provided as a local fallback.
- **Cloudinary for file storage** — production-ready file handling with automatic CDN delivery. The trade-off is a dependency on a third-party service.
- **SWR client caching** — reduces API calls and improves perceived performance with stale-while-revalidate semantics. The trade-off is that data can be stale between revalidations.
- **Unified submissions API** — a single `/api/forms/:id/submissions` endpoint eliminates the N+1 problem when loading submissions across versions. The trade-off is a slightly more complex query.

---

## 🚀 What I Would Add With More Time

- **Auth (NextAuth.js or Clerk)** — scope form creation and version publishing to authenticated users; submissions can remain public or gated depending on the form. Role-based access (admin vs respondent) would protect the management endpoints while keeping the fill-in experience open.

- **AI-assisted schema generation** — expose a prompt-to-schema endpoint that takes a natural language description (e.g. *"a job application with name, email, years of experience as a number, and a CV upload"*) and returns a valid JSON Schema using an LLM (Claude or GPT-4o). The output is treated as a draft — the user reviews and publishes it as a new `FormVersion`. This keeps the human in the loop while removing the need to hand-write JSON Schema. The validation pipeline is unchanged: whatever schema is stored gets fed to AJV regardless of how it was produced.

- **Form designer UI** — drag-and-drop field builder as a visual alternative to the AI prompt; produces the same JSON Schema output and goes through the same publish flow.

- **Submission review view** — admin-facing table to browse, filter, and export responses per version.

- **Pagination and filtering** on list endpoints — cursor-based pagination for submissions; filter by date range or version.

- **Rate limiting** on the submission endpoint to prevent abuse.

- **E2E tests** (Playwright) covering the fill → submit → confirmation flow.

---

## 🤖 AI Tool Usage

- **Tools:** Claude (Anthropic), ChatGPT (OpenAI)
- **Used for:** Initial folder structure scaffold, boilerplate route stubs, README template
- **Verified:** All logic (validation flow, transaction strategy, schema design) was reviewed and understood line by line before committing.

---

## 🚦 Error Handling

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

## 📈 Scaling to Production

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

## 🧪 Running Tests

```bash
npm test
```

```bash
npm test -- --coverage
```

### Test results

```
Test Files  5 passed (5)
     Tests  28 passed (28)
```