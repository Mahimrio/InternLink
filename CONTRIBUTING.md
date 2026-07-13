# Contributing to InternLink

Thank you for contributing! Please follow these guidelines to keep the project consistent and maintainable.

---

## Quick Start (TL;DR)

```bash
# 1. Clone and setup
git clone https://github.com/Mahimrio/InternLink.git
cd InternLink

# 2. Copy env template and generate JWT secret
cp .env.example .env
openssl rand -base64 32  # paste output into .env as JWT_SECRET

# 3. Start full stack (API + local Postgres)
docker compose up --build -d
# API: http://localhost:8080  |  Swagger: http://localhost:8080/swagger

# 4. Start web dev server (separate terminal)
cd web && npm ci && npm run dev
# Web: http://localhost:3000
```

---

## Before You Start

### 1. Environment Setup

- [ ] **Install required toolchain**:
  - .NET SDK 8.x: `winget install Microsoft.DotNet.SDK.8`
  - Node.js 20.x LTS: `winget install OpenJS.NodeJS.LTS`
  - Docker Desktop: `winget install Docker.DockerDesktop`
  - Git: `winget install Git.Git`
  - EF Core tools: `dotnet tool install --global dotnet-ef`

- [ ] **Verify versions**:
  ```bash
  dotnet --version && node --version && npm --version && docker --version && dotnet-ef --version && git --version
  ```

- [ ] **Copy environment template and configure**:
  ```bash
  cp .env.example .env
  # Edit .env with your values (at minimum: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, JWT_SECRET)
  ```

- [ ] **Generate a secure JWT secret**:
  ```bash
  openssl rand -base64 32
  # Paste into .env as JWT_SECRET
  ```

### 2. Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, protected |
| `develop` | Integration branch for ongoing work |
| `feature/<short-desc>` | New features, from `develop` |
| `fix/<short-desc>` | Bug fixes, from `develop` |
| `hotfix/<short-desc>` | Urgent production fixes, from `main` |

### 3. Before Coding

- [ ] Pick or create an issue in GitHub Issues
- [ ] Assign yourself to the issue
- [ ] Create a feature branch from `develop`:
  ```bash
  git checkout develop && git pull && git checkout -b feature/my-feature
  ```
- [ ] Read existing code in the relevant area to understand patterns

---

## Development Workflows

### Option A: Full Stack with Docker (Recommended)

Runs API + local Postgres in containers. Web runs separately via `npm run dev`.

```bash
# Start infrastructure
docker compose up --build -d

# Check status
docker compose ps
# All services should show "Up" / "healthy"

# View logs
docker compose logs -f api    # API logs
docker compose logs -f db     # Postgres logs

# Stop and clean
docker compose down -v        # -v removes the pgdata volume
```

**Switch to Supabase instead of local DB:**
```bash
# Edit .env with your Supabase credentials
# POSTGRES_USER=your-supabase-user
# POSTGRES_PASSWORD=your-supabase-password
# POSTGRES_DB=your-supabase-db

# Start only the API (no local db)
docker compose up --build -d api
```

### Option B: Local Development (No Docker for API)

```bash
# Terminal 1: API
cd api
dotnet restore
dotnet run
# Runs on http://localhost:5000 / https://localhost:5001

# Terminal 2: Web
cd web
npm ci
npm run dev
# Runs on http://localhost:3000

# Terminal 3 (optional): Postgres
docker compose up -d db
# Or use your own Postgres instance
```

### Option C: Web Only (Frontend Focus)

```bash
cd web
npm ci
npm run dev
# Uses mock/empty API calls — good for UI work
```

---

## While Coding

### Code Style

| Language | Rules |
|----------|-------|
| **C#** | .NET naming conventions, `dotnet format` before commit |
| **TypeScript/React** | ESLint + Prettier (`npm run lint`, `npm run format`) |
| **Commits** | Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` |
| **Commits** | One logical change per commit; reference issue (`#123`) |

### Project Structure (Know Where Things Go)

```
api/                          # ASP.NET Core 8 Web API
  Controllers/
    Student/ Company/ Admin/ Counselor/   # Route-grouped: api/student/*, api/company/*
  Models/                     # EF Core entities (internal)
  DTOs/                       # Response DTOs: <Entity>Dto (JobDto, ApplicationDto)
  ViewModels/                 # Request DTOs for auth: <Action><Entity>RequestDto (LoginRequestDto)
  Data/                       # ApplicationDbContext, Migrations/
  Repositories/
    Interface/                # Repository contracts
    Implementation/           # EF Core implementations
  Services/                   # Business logic (AIService, ResumeService, RecommendationService)
  Helpers/
  Program.cs                  # DI, middleware, Swagger
  appsettings.json            # Structure only — real values via env vars / user-secrets

web/                          # Next.js 14+ (App Router, TS, Tailwind)
  app/                        # App Router pages & Route Handlers (BFF)
  components/
    student/ company/ admin/ counselor/ shared/  # By feature, NOT flat
  lib/
    api-client.ts             # SINGLE typed API client — no fetch() in components
  styles/                     # Global styles only

docs/diagrams/                # Architecture diagrams
.github/workflows/            # CI pipelines
```

### Backend Conventions (Critical)

- **Controllers return DTOs only — never EF entities directly**
  - Response: `JobDto`, `ApplicationDto`, `StudentDto`
  - Request: `CreateJobRequestDto`, `UpdateProfileRequestDto`, `LoginRequestDto`
- **Business logic lives in `Services/`, not `Controllers/`**
  - Controllers: parse request → call service → return DTO
- **Repositories**: interfaces in `Repositories/Interface/`, impl in `Repositories/Implementation/`
  - Controllers depend on interfaces, never on `ApplicationDbContext` directly
- **Async everywhere**: every async method ends with `Async` and takes `CancellationToken`:
  ```csharp
  public async Task<JobDto?> GetByIdAsync(int id, CancellationToken ct)
  ```
- **Routing**: grouped by role, versioned by path:
  - `api/auth/*` (unscoped: login, register, refresh, logout, OAuth)
  - `api/student/*` · `api/company/*` · `api/admin/*` · `api/counselor/*`
- **Error response shape** — every error path returns this exact JSON:
  ```json
  { "error": "Human-readable message", "details": { } }
  ```
  - `400` validation · `401` unauthenticated · `403` wrong role / unverified email · `404` not found · `409` conflict (e.g. duplicate application) · `500` unexpected

### Frontend Conventions

- **Tailwind only** — no `style=`, no CSS modules (unless justified in comment)
- **Components by feature**: `components/student/`, `components/shared/`, etc.
- **Single API client**: all HTTP via `lib/api-client.ts` — no scattered `fetch()`
- **Server Components by default** — add `"use client"` only when interactivity requires it
- **Forms**: `react-hook-form` + `zod` schemas that **mirror API request DTOs** field-for-field

### Database Changes

- [ ] Create EF Core migration:
  ```bash
  dotnet ef migrations add MigrationName -p api/InternLinkApi.csproj -s api/InternLinkApi.csproj
  ```
- [ ] Review generated migration SQL
- [ ] Test migration up/down locally

### API Changes

- [ ] Update OpenAPI/Swagger annotations
- [ ] Update or add integration tests
- [ ] Document breaking changes in PR description

### Frontend Changes

- [ ] Run type check: `npm run typecheck` (in `web/`)
- [ ] Run lint: `npm run lint` (in `web/`)
- [ ] Test in browser (`npm run dev`)
- [ ] Ensure responsive design works

### Testing

- [ ] Write unit tests for new logic (xUnit for .NET, Vitest/Jest for frontend)
- [ ] Run existing tests: `dotnet test` / `npm test`
- [ ] All tests must pass before PR

---

## Before Opening a Pull Request

- [ ] Rebase onto latest `develop`:
  ```bash
  git fetch origin && git rebase origin/develop
  ```
- [ ] Run full test suite locally
- [ ] Run linters/formatters:
  ```bash
  dotnet format
  cd web && npm run lint && npm run format
  ```
- [ ] Update documentation if behavior changed (README, API docs, comments)
- [ ] Self-review your diff: `git diff develop...HEAD`
- [ ] Write a clear PR description:
  - What problem does this solve?
  - How was it tested?
  - Any breaking changes?
  - Screenshots for UI changes

---

## Pull Request Process

1. Open PR against `develop` (not `main`)
2. Fill out the PR template completely
3. Request review from at least 1 team member
4. Address all review comments (resolve conversations)
5. Ensure CI passes (build, tests, lint)
6. Squash and merge after approval
7. Delete the feature branch after merge

---

## After Merge

- [ ] Pull latest `develop`: `git checkout develop && git pull`
- [ ] Delete local feature branch: `git branch -d feature/my-feature`
- [ ] If deployed to staging, verify the feature works in staging environment
- [ ] Close the associated GitHub issue (or let auto-close via "Closes #123" in PR description)

---

## Release Process (Maintainers Only)

1. Create release branch: `git checkout -b release/v1.x.x develop`
2. Version bump, update CHANGELOG.md
3. PR to `main` with version bump
4. Tag release: `git tag -a v1.x.x -m "Release v1.x.x"`
5. Deploy to production
6. Merge `main` back to `develop`

---

## Code of Conduct

- Be respectful and inclusive
- No harassment, discrimination, or offensive language
- Focus on constructive feedback
- Follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

---

## Questions?

- Check existing issues and discussions first
- Ask in the PR or issue comments
- For urgent issues, tag maintainers

---

## TL;DR Checklist for Every PR

- [ ] Branched from `develop`
- [ ] Tests pass locally
- [ ] Lint/format clean
- [ ] Docs updated
- [ ] PR description complete
- [ ] CI green
- [ ] Reviewed & approved