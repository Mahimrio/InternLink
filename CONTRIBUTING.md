# Contributing to InternLink

Thank you for contributing! This guide covers everything needed to start contributing effectively.

---

## Before You Start

### 1. Environment Setup

**Install Prerequisites:**
```bash
# Windows (winget)
winget install Microsoft.DotNet.SDK.8
winget install OpenJS.NodeJS.LTS
winget install Docker.DockerDesktop
winget install Git.Git

# Verify versions
dotnet --version      # 8.0.x
node --version        # 20.x
npm --version         # 10.x
docker --version      # 24.x
dotnet-ef --version   # 8.x (install: dotnet tool install --global dotnet-ef)
git --version         # 2.x
```

**Choose Your Local Dev Workflow:**

| Workflow | When to Use | Command |
|----------|-------------|---------|
| **A: Docker Compose (Default)** | Full stack offline, closest to prod | `docker compose up --build -d` |
| **B: Supabase** | Testing against real cloud DB | Edit `.env` → `docker compose up --build -d api` |
| **C: Fully Local** | Fastest API iteration, no Docker for API | See [Workflow C](#workflow-c-fully-local-no-docker-for-api) |

**Common Setup:**
```bash
# 1. Clone and enter repo
git clone https://github.com/Mahimrio/InternLink.git
cd InternLink

# 2. Copy env template
cp .env.example .env

# 3. Generate JWT secret
openssl rand -base64 32
# Paste output into .env as JWT_SECRET=...

# 4. Start (Workflow A example)
docker compose up --build -d
```

**Verify Everything Works:**
```bash
# API health
curl http://localhost:8080/swagger/index.html

# Web app
open http://localhost:3000

# Check containers
docker compose ps
# All services should show "healthy" or "Up"
```

---

### 2. Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready | Protected, PR required |
| `develop` | Integration branch | PR required |
| `feature/<short-desc>` | New features | From `develop` |
| `fix/<short-desc>` | Bug fixes | From `develop` |
| `hotfix/<short-desc>` | Urgent prod fixes | From `main` |

**Create a feature branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature-name
```

---

### 3. Before Coding

- [ ] Pick or create an issue in GitHub Issues
- [ ] Assign yourself to the issue
- [ ] Create feature branch from `develop` (see above)
- [ ] Read existing code in the relevant area to understand patterns:
  - **API**: `api/Controllers/`, `api/Services/`, `api/DTOs/`
  - **Web**: `web/components/`, `web/lib/api-client.ts`, `web/app/`

---

## While Coding

### Code Style

| Language | Tools | Commands |
|----------|-------|----------|
| **C#** | .NET conventions, `dotnet format` | `dotnet format` (run in `api/`) |
| **TypeScript/React** | ESLint + Prettier | `npm run lint` / `npm run format` (run in `web/`) |

**Commit Messages:** Conventional Commits — `type(scope): description`
- Imperative mood, lowercase, no trailing period
- Reference issue: `feat(api): add job search endpoint #42`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `style`

---

### Database Changes

```bash
# 1. Create migration (from api/ directory)
cd api
dotnet ef migrations add MigrationName -p InternLinkApi.csproj -s InternLinkApi.csproj

# 2. Review generated SQL in Migrations/*MigrationName.cs

# 3. Test locally
dotnet ef database update          # Apply
dotnet ef database update 0        # Rollback to test down migration
dotnet ef database update          # Re-apply
```

---

### API Changes

- **Controllers**: Thin — parse request → call service → return DTO
- **DTOs**: 
  - Response: `<Entity>Dto` (e.g., `JobDto`, `StudentDto`)
  - Request: `<Action><Entity>RequestDto` (e.g., `CreateJobRequestDto`, `UpdateProfileRequestDto`)
  - Auth: in `ViewModels/` (e.g., `LoginRequestDto`, `RegisterRequestDto`)
- **Business Logic**: In `Services/` — never in Controllers
- **Repositories**: Interfaces in `Repositories/Interface/`, impl in `Repositories/Implementation/`
- **Async**: All async methods end with `Async`, accept `CancellationToken`
- **Errors**: Always return `{ "error": "message", "details": {} }` with correct status code

---

### Frontend Changes

- **Components by feature**: `components/student/`, `components/shared/`, etc.
- **Single API client**: All HTTP via `lib/api-client.ts` — no `fetch()` in components
- **Server Components by default**: Add `"use client"` only when needed
- **Forms**: `react-hook-form` + `zod` schemas mirroring API request DTOs
- **Route Handlers**: BFF only — proxy, cookies, NO business logic

---

### Testing

- **Write unit tests** for new logic:
  - C#: xUnit in `api/` test project
  - TS: Vitest/Jest in `web/`
- **Run existing tests before PR:**
  ```bash
  # API
  cd api && dotnet test

  # Web
  cd web && npm test
  ```
- All tests must pass before PR

---

## Before Opening a Pull Request

- [ ] Rebase onto latest `develop`: `git fetch origin && git rebase origin/develop`
- [ ] Run full test suite locally
- [ ] Run linters/formatters:
  ```bash
  dotnet format
  cd web && npm run lint && npm run format
  ```
- [ ] Update documentation if behavior changed (README, API docs, comments)
- [ ] Self-review your diff: `git diff develop...HEAD`
- [ ] Write clear PR description:
  - What problem does this solve?
  - How was it tested?
  - Any breaking changes?
  - Screenshots for UI changes

---

## Pull Request Process

1. **Open PR against `develop`** (not `main`)
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
- [ ] If deployed to staging, verify the feature works in staging
- [ ] Close the associated GitHub issue (or use "Closes #123" in PR description)

---

## Release Process (Maintainers Only)

1. Create release branch: `git checkout -b release/v1.x.x develop`
2. Version bump, update `CHANGELOG.md`
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
- [ ] Tests pass locally (`dotnet test` / `npm test`)
- [ ] Lint/format clean (`dotnet format` / `npm run lint && npm run format`)
- [ ] Docs updated (README, API docs, comments)
- [ ] PR description complete (problem, testing, breaking changes, screenshots)
- [ ] CI green (GitHub Actions: `api-build`, `web-build`)
- [ ] Reviewed & approved by at least 1 team member

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
cd api && dotnet ef migrations add Name -p InternLinkApi.csproj -s InternLinkApi.csproj

# View CI logs
gh run view <run-id> --log
```