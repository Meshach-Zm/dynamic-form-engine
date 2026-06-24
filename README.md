# Dynamic Form Builder Engine

> Full-Stack Developer Technical Assessment — Assignment A

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm

### 1. Start the database

```bash
docker compose up -d
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

## API Endpoints

| Method | Path                                        | Description                                 |
| ------ | ------------------------------------------- | ------------------------------------------- |
| GET    | `/api/forms`                                | List all form templates                     |
| POST   | `/api/forms`                                | Create a new form template                  |
| GET    | `/api/forms/:id`                            | Get a form template with its latest version |
| POST   | `/api/forms/:id/versions`                   | Publish a new version of a form             |
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

## What I would add with more time

- Auth (NextAuth.js or Clerk)
- Form designer UI (drag-and-drop field builder that produces JSON Schema)
- Submission list / review view for admins
- Pagination and filtering on submissions
- Rate limiting on submission endpoint
- E2E tests (Playwright)

---

## AI Tool Usage

<!-- Fill this in per the assessment requirement -->
- **Tool:** Claude (Anthropic)
- **Used for:** Initial folder structure scaffold, boilerplate route stubs, README template
- **Verified:** All logic (validation flow, transaction strategy, schema design) was reviewed and understood line by line before committing.

---

## Running Tests

```bash
npm test
```

```bash
npm test -- --coverage
```
