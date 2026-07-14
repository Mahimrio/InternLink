# InternLink

[![CI](https://github.com/Mahimrio/InternLink/actions/workflows/ci.yml/badge.svg)](https://github.com/Mahimrio/InternLink/actions/workflows/ci.yml)

**InternLink** — AI-powered university career & internship portal for CSE 3200 (implementation) + CSE 3224 (design/SQA), AUST.

Connects students, companies, counselors, and admins through a single platform with AI for resume analysis, job matching, and interview prep.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INTERNLINK ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐       ┌──────────────────────────┐       ┌────────────┐  │
│   │   Browser    │──────▶│   Next.js (Vercel)       │──────▶│  ASP.NET   │  │
│   │  (no tokens) │       │   App Router · TS        │       │  Core 8    │  │
│   │              │       │   Tailwind CSS           │       │  Web API   │  │
│   │              │       │   Route Handlers = BFF   │       │  (Render)  │  │
│   │              │       │   httpOnly refresh cookie│       │  JWT/EF    │  │
│   └──────────────┘       └────────────┬─────────────┘       └─────┬──────┘  │
│                                       │ Bearer access token       │         │
│                                       │ (15 min, Authorization)   │         │
│                                       ▼                           │         │
│                              ┌──────────────────────────┐       │         │
│                              │   Supabase PostgreSQL    │◀──────┘         │
│                              │   (15 tables, EF Core)   │    Npgsql       │
│                              └──────────────────────────┘                 │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  AUTH FLOW                                                                  │
│  ────────                                                                    │
│  1. Browser → Next.js Route Handler (BFF)                                   │
│  2. BFF proxies to .NET API: /api/auth/login                                │
│  3. .NET API validates, returns:                                            │
│     - Access token (JWT, 15 min) in response body                           │
│     - Refresh token (7 days) in httpOnly, Secure, SameSite=Lax cookie       │
│  4. BFF sets refresh cookie on client-accessible access token (short-lived), stores refresh cookie │
│  5. Subsequent requests: BFF attaches Bearer token, proxies to API          │
│  6. On 401: BFF uses refresh cookie → /api/auth/refresh → new token pair    │
│  7. Raw tokens NEVER reach client-side JavaScript                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Vercel |
| **Backend** | ASP.NET Core 8, Controllers-only, EF Core 8, Npgsql | Docker → Render |
| **Database** | Supabase PostgreSQL (15 tables) | Supabase |
| **Auth** | JWT (15 min) + httpOnly refresh cookie (7 days, rotated) | BFF pattern |
| **Cache/Queue** | Redis (caching, sessions, job queue) | Docker/Render |
| **Storage** | MinIO (S3-compatible) for file uploads | Docker/Render |
| **Email** | SMTP (MailHog for dev) | Docker |

---

## Local Development — Two Workflows

### Workflow A: Fully Offline with Local PostgreSQL (Default)

```bash
# 1. Copy compose env template and edit if needed
cp .env.example .env

# 2. Generate JWT secret
openssl rand -base64 32
# Paste into .env as JWT_SECRET

# 3. Build and start both API and local DB
docker compose up --build -d
# API on http://localhost:8080
# Swagger on http://localhost:8080/swagger
# Postgres internal only (port 5432 inside compose network)

# 4. In another terminal, start the web app
cd web && npm ci && npm run dev
# Web on http://localhost:3000
```

**The `docker-compose.yml` uses `depends_on: db` with a healthcheck**, so the API waits until Postgres is ready. The connection string is assembled from `POSTGRES_*` vars in `.env`.

### Workflow B: Point API at Your Supabase Dev Project (No Local DB)

```bash
# 1. Copy .env.example to .env and fill in your Supabase credentials
cp .env.example .env
# Edit .env: set POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB to your Supabase values
# (Host/port are in Supabase dashboard → Settings → Database)

# 2. Start only the API (omit the db service)
docker compose up --build -d api
# API on http://localhost:8080, connects directly to your Supabase Postgres
```

**Switching between them is a one-line `.env` change** — no code or compose file edits.

### Workflow C: Fully Local (No Docker for API)

```bash
# Terminal 1: Start infrastructure only
docker compose up -d db redis minio mailhog

# Terminal 2: Run API locally
cd api
dotnet restore
dotnet run
# Runs on http://localhost:5000 / https://localhost:5001

# Terminal 3: Run Web locally
cd web
npm ci
npm run dev
# Runs on http://localhost:3000
```

---

## Prerequisites

- **Docker Desktop** (includes Docker Compose)
- **.NET 8 SDK** (for local API development): `winget install Microsoft.DotNet.SDK.8`
- **Node.js 20+** (for local web development): `winget install OpenJS.NodeJS.LTS`
- **Git**: `winget install Git.Git`
- **EF Core tools**: `dotnet tool install --global dotnet-ef`

---

## Environment Variables

See `.env.example` for all configurable options. Required for local dev:

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Postgres username | `postgres` |
| `POSTGRES_PASSWORD` | Postgres password | `postgres` |
| `POSTGRES_DB` | Database name | `internlink_dev` |
| `JWT_SECRET` | Generate with `openssl rand -base64 32` | `abc123...` |
| `SMTP_*` | MailHog (included in docker-compose) for local email testing | `localhost:1025` |

---

## Database Connection Strings

The API reads the connection string from `ConnectionStrings:SupabaseDb` (set via the `ConnectionStrings__SupabaseDb` environment variable or `appsettings.json`).

### Local PostgreSQL (via Docker Compose)

```
Host=db;Port=5432;Database=internlink_dev;Username=postgres;Password=postgres;Include Error Detail=true
```

The host is `db` (the Compose service name). `Include Error Detail=true` is safe in Development because the database is not exposed to the internet.

### Supabase (Development — Direct Connection)

```
Host=<project>.supabase.co;Port=5432;Database=postgres;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

Get these values from Supabase Dashboard → **Project Settings** → **Database**. The `SSL Mode=Require` and `Trust Server Certificate=true` are required — Supabase enforces TLS on all connections.

### Supabase (Production / Render — Pooled via Supavisor)

```
Host=<project>.supabase.co;Port=6543;Database=postgres;Username=<user>.pooler;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

>**Use the pooler (port 6543) when deploying to Render.** Render's containers open many short-lived connections. The Supavisor pooler handles this much better than the direct connection's lower connection limit. The `Username` suffix `.pooler` is also required when connecting through the pooler.

**Tip:** Switching between local and Supabase is a single `.env` change — the connection string is never hardcoded in source code.

---

```
InternLink/
├── api/                          # ASP.NET Core 8 Web API
│   ├── Controllers/
│   │   ├── Student/              # api/student/*
│   │   ├── Company/              # api/company/*
│   │   ├── Admin/                # api/admin/*
│   │   └── Counselor/            # api/counselor/*
│   ├── Models/                   # EF Core entities (internal)
│   ├── DTOs/                     # Response DTOs: <Entity>Dto (JobDto, ApplicationDto)
│   ├── ViewModels/               # Request DTOs for auth: <Action><Entity>RequestDto
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── Migrations/
│   ├── Repositories/
│   │   ├── Interface/            # Repository contracts
│   │   └── Implementation/       # EF Core implementations
│   ├── Services/                 # Business logic
│   │   ├── AIService/
│   │   ├── ResumeService/
│   │   └── RecommendationService/
│   ├── Helpers/
│   ├── Program.cs
│   ├── appsettings.json          # Structure only — real values via env/user-secrets
│   ├── InternLinkApi.csproj
│   └── Dockerfile                # Multi-stage: sdk:8.0 → aspnet:8.0
│
├── web/                          # Next.js 14+ (App Router, TS, Tailwind)
│   ├── app/
│   │   ├── api/                  # Route Handlers = BFF only
│   │   ├── student/ company/ admin/ counselor/  # Pages by role
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── student/ company/ admin/ counselor/ shared/  # By feature
│   ├── lib/
│   │   └── api-client.ts         # SINGLE typed API client
│   ├── styles/
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── docs/diagrams/                # Architecture diagrams
├── .github/workflows/            # CI pipelines
│
├── docker-compose.yml            # api + db (postgres:16-alpine) + healthchecks
├── .env.example                  # Compose-specific: POSTGRES_USER/PASSWORD/DB
├── AGENTS.md                     # This file — source of truth for AI agents
├── CONTRIBUTING.md               # Contribution guidelines
├── InternLink.sln                # Solution file referencing api/InternLinkApi.csproj
└── README.md                     # This file
```

---

## Database — 15 Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `Users` | Auth identity (email, password hash, role, verified flag) | 1:1 to `Students` or `Companies` |
| `Roles` | Lookup: Student, Company, Admin, Counselor | 1:N from `Users` |
| `Students` | Student profile (name, university, dept, CGPA, bio) | 1:1 `Users`, 1:N `Applications`, `Resumes`, `Assessments` |
| `Companies` | Company profile (name, sector, website, verified) | 1:1 `Users`, 1:N `Jobs` |
| `Jobs` | Internship posting (title, description, location, stipend, deadline) | N:1 `Companies`, 1:N `Applications`, N:M `Skills` via `JobSkills` |
| `Applications` | Student ↔ Job application (status, cover letter, applied_at) | N:1 `Students`, N:1 `Jobs`, 1:N `Interviews` |
| `Interviews` | Scheduled interview slot (datetime, mode, notes, outcome) | N:1 `Applications` |
| `Resumes` | Uploaded resume file (path, parsed text, AI score) | N:1 `Students` |
| `Skills` | Skill lookup (name, category) | N:M `Students` via `StudentSkills`, N:M `Jobs` via `JobSkills` |
| `StudentSkills` | Join: student ↔ skill (+ proficiency) | N:1 `Students`, N:1 `Skills` |
| `JobSkills` | Join: job ↔ skill (+ required level) | N:1 `Jobs`, N:1 `Skills` |
| `Notifications` | In-app message (type, payload, read_at) | N:1 `Users` |
| `Assessments` | MCQ / coding result (score, breakdown) | N:1 `Students`, N:1 `Jobs` (optional) |
| `CounselorFeedback` | Counselor note on a student | N:1 `Counselors` (via `Users`), N:1 `Students` |
| `AIHistory` | Audit log of every AI call (prompt, response, tokens, cost, latency, user_id) | N:1 `Users` |

---

## CI Pipeline

Runs on every push/PR to `main` and `develop` (`.github/workflows/ci.yml`):

| Job | Steps |
|-----|-------|
| **api-build** | `actions/checkout@v4` → `setup-dotnet@v4` (8.0.x) → NuGet cache (`hashFiles('**/*.csproj')`) → `dotnet restore` → `dotnet build -c Release` → `docker build -f api/Dockerfile .` |
| **web-build** | `actions/checkout@v4` → `setup-node@v4` (20) → npm cache (`web/package-lock.json`) → `npm ci` → `npm run lint` → `npm run build` |
| **Both** | Spin up `postgres:16-alpine` service container (healthchecked) for integration parity; `timeout-minutes: 15`; `permissions: contents: read`; concurrency group cancels stale runs |

---

## Key Conventions (Must Follow)

### Backend (API)
- **Controllers return DTOs only** — never EF entities
  - Response: `<Entity>Dto` (e.g., `JobDto`, `ApplicationDto`)
  - Request: `<Action><Entity>RequestDto` (e.g., `CreateJobRequestDto`, `LoginRequestDto`)
- **Business logic in `Services/`** — Controllers are thin: parse → call service → return DTO
- **Repository pattern** — Interfaces in `Repositories/Interface/`, impl in `Repositories/Implementation/`
- **Async everywhere** — Methods end with `Async`, accept `CancellationToken` from controller
- **Error shape** — Always `{ "error": "message", "details": {} }` with correct HTTP status:
  - `400` validation · `401` unauthenticated · `403` wrong role/unverified · `404` not found · `409` conflict · `500` unexpected

### Frontend (Web)
- **Tailwind only** — no `style=`, no CSS modules (unless justified in comment)
- **Components by feature**: `components/student/`, `components/shared/`, etc.
- **Single API client**: all HTTP via `lib/api-client.ts` — no `fetch()` in components
- **Server Components by default** — `"use client"` only when interactivity requires it
- **Forms**: `react-hook-form` + `zod` schemas mirroring API request DTOs field-for-field
- **Route Handlers** (`app/api/.../route.ts`): BFF only — proxy, cookie handling, NO business logic

### Auth
- JWT access token (15 min) in `Authorization: Bearer` header
- Refresh token (7 days) in **httpOnly, Secure, SameSite=Lax** cookie, rotated on every use
- Next.js Route Handlers hold refresh cookie, exchange for new tokens, never expose raw tokens to client JS

### Database
- EF Core / LINQ only — parameterized by construction
- **Never raw SQL string interpolation** — if unavoidable, use `FromSqlInterpolated`
- Migrations: `dotnet ef migrations add Name -p api/InternLinkApi.csproj -s api/InternLinkApi.csproj`

### Non-Functional
- **Performance**: page loads < 2s; APIs < 500ms p95 (AI calls async/background)
- **Passwords**: PBKDF2/SHA256 via ASP.NET Core Identity defaults
- **AI calls**: always `await`, wrapped in `try/catch` with fallback, logged to `AIHistory` with **real token counts** (never estimates)
- **Money/cost**: `decimal` / `numeric` only — never `float`/`double` (`AIHistory.CostUsd` = `decimal(18,6)`)

---

## Git Conventions

- **Branches**: one feature per branch, prefixed: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`, `test/`, `refactor/`, `style/`
- **Commits**: Conventional Commits — `type(scope): description` (imperative, lowercase, no period)
  - Good: `feat(api): add job recommendation endpoint`
  - Bad: `Added Job Recommendation Endpoint.`
- **PR title = commit message** (single commit) or branch summary

---

## Do Not

- ❌ Store JWTs in `localStorage` or non-httpOnly cookies
- ❌ Call LLM APIs synchronously (blocking request threads)
- ❌ Commit secrets, `.env*` files, or connection strings with credentials
- ❌ Bypass repository layer from controllers (no `DbContext` injection in controllers)
- ❌ Add business logic in Next.js Route Handlers — BFF proxy/cookie handling only
- ❌ Use `any` in TypeScript without `// TODO: <reason>` justification comment
- ❌ Catch exceptions and swallow silently — log or rethrow; never empty `catch {}`

---

## When in Doubt

If a later prompt's instructions seem to conflict with anything stated here, **flag the conflict in your response** rather than silently picking one. This file is the source of truth and should be updated (via a small follow-up commit) to reflect the new decision, not quietly overridden.

---

## Database Migrations

Apply pending migrations and seed development data to your database:

```bash
# Local PostgreSQL (Docker Compose must be running)
docker compose up -d db
dotnet ef database update --project api --startup-project api

# Supabase (set ConnectionStrings__SupabaseDb in environment first)
$env:ConnectionStrings__SupabaseDb="Host=<project>.supabase.co;Port=5432;Database=postgres;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true"
dotnet ef database update --project api --startup-project api

# Create a new migration
dotnet ef migrations add MigrationName --project api --startup-project api
```

On first run in Development mode (`ASPNETCORE_ENVIRONMENT=Development`), the API automatically runs `Database.MigrateAsync()` followed by `DbSeeder.SeedAsync()`, so the database is fully ready without manual steps.

> ⚠️ **Seeding only runs in Development.** When `ASPNETCORE_ENVIRONMENT=Production`, neither migration nor seeding is executed automatically.

### Seeded Development Credentials (Dev Only — Never Reuse)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@internlink.test` | `Admin@123` |
| **Student** | `student@internlink.test` | `Student@123` |
| **Company (TechNest Solutions)** | `hr@technestsolutions.test` | `Company@123` |
| **Company (DataForge Inc.)** | `hr@dataforgeinc.test` | `Company@123` |
| **Company (CloudPeak Systems)** | `hr@cloudpeaksystems.test` | `Company@123` |

These accounts are created by the development seeder when the database is empty. **Do not use these credentials or email addresses in production.** Change them in `api/Data/DbSeeder.cs` if you need different dev accounts.

---

## CORS Configuration

The API uses a named CORS policy (`FrontendPolicy`) that restricts cross-origin requests to an explicit allowlist.

| Setting | Value |
|---------|-------|
| Allowed origins | Read from `Cors__AllowedOrigins` env var (comma-separated) |
| Default (Development) | `http://localhost:3000` |
| Allowed methods | GET, POST, PUT, DELETE, OPTIONS |
| Allowed headers | Authorization, Content-Type |
| Credentials | Allowed (`AllowCredentials`) |

Vercel preview deployment URLs (`*.vercel.app`) are also allowed automatically via a custom `SetIsOriginAllowed` predicate.

### Updating for Production (Phase 8)

When you finalize your Vercel production URL, update `Cors__AllowedOrigins` in Render's environment variables to include both the production URL and any preview URLs:

```
Cors__AllowedOrigins=https://your-actual-project.vercel.app,http://localhost:3000
```

For Render: Settings → Environment → Add `Cors__AllowedOrigins` with the comma-separated list.

---

## Quick Reference Commands

```bash
# Full stack (Workflow A)
docker compose up --build -d
cd web && npm ci && npm run dev

# API with Supabase (Workflow B)
# Edit .env with Supabase creds first
docker compose up --build -d api

# Local dev (Workflow C)
docker compose up -d db redis minio mailhog
cd api && dotnet run
cd web && npm run dev

# Tests
cd api && dotnet test
cd web && npm test

# Lint/format
dotnet format
cd web && npm run lint && npm run format

# Create migration
dotnet ef migrations add Name --project api --startup-project api

# Apply migration
dotnet ef database update --project api --startup-project api

# View CI logs
gh run view <run-id> --log
```