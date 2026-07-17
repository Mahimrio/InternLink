# AGENTS

Standing context for AI agents and contributors working in this monorepo. **This file is the source of truth.** If a later prompt's instructions conflict with something here, flag the conflict in your response and update this file via a follow-up commit — do not silently override.

---

## 1. Project

**InternLink** — AI-powered university career & internship portal.
- **Courses:** CSE 3200 (implementation) + CSE 3224 (design / SQA), AUST.
- **Goal:** connect students, companies, counselors, and admins through a single platform that uses AI for resume analysis, job matching, and interview prep.

## 2. Architecture

```
                 ┌──────────────────────────┐
   Browser ─────▶│  Next.js (Vercel)        │  App Router · TS · Tailwind
   (no tokens)   │  Route Handlers = BFF    │  httpOnly refresh cookie
                 └────────────┬─────────────┘
                              │ Bearer access token (15 min)
                              ▼
                 ┌──────────────────────────┐
                 │  ASP.NET Core Web API    │  Dockerized · Render
                 │  JWT auth · EF Core      │  Business logic in Services/
                 └────────────┬─────────────┘
                              │ Npgsql / EF Core
                              ▼
                 ┌──────────────────────────┐
                 │  Supabase PostgreSQL     │  15 tables · see §5
                 └──────────────────────────┘
```

- Frontend lives in `web/` (Next.js 14+, App Router, TypeScript, Tailwind).
- Backend lives in `api/` (ASP.NET Core 8, controllers-only, EF Core, Npgsql → Supabase Postgres).
- **Auth:** JWT access token (~15 min) in `Authorization: Bearer` header + refresh token (~7 days) in **httpOnly, Secure, SameSite=Lax** cookie, rotated on every use. Next.js Route Handlers act as a BFF: they hold the refresh cookie, exchange it for new tokens, and **never let raw tokens reach client-side JS**.

## 3. Backend conventions

- **Controllers return DTOs only — never EF entities.**
  - Response DTOs: `<Entity>Dto` — e.g. `JobDto`, `ApplicationDto`, `StudentDto`.
  - Request DTOs: `<Action><Entity>RequestDto` — e.g. `CreateJobRequestDto`, `UpdateProfileRequestDto`, `LoginRequestDto`.
- **Business logic lives in `Services/`, not `Controllers/`.** Controllers are thin: parse request → call service → return DTO.
- **Repositories:** interfaces in `Repositories/Interface/`, implementations in `Repositories/Implementation/`. Controllers depend on interfaces, never on `ApplicationDbContext` directly.
- **Async everywhere:** every async method ends with `Async` and accepts a `CancellationToken` parameter threaded from the controller:
  ```csharp
  public async Task<JobDto?> GetByIdAsync(int id, CancellationToken ct)
  ```
- **Routing:** grouped by role, versioned implicitly by path:
  - `api/auth/*` (unscoped: login, register, refresh, logout, OAuth)
  - `api/student/*` · `api/company/*` · `api/admin/*` · `api/counselor/*`
- **Error response shape** — every error path returns this exact JSON with the correct HTTP status:
  ```json
  { "error": "Human-readable message", "details": { /* optional, structured */ } }
  ```
  - `400` validation · `401` unauthenticated · `403` wrong role / unverified email · `404` not found · `409` conflict (e.g. duplicate application) · `500` unexpected.

## 4. Frontend conventions

- **Tailwind only.** No `style=` inline, no CSS modules unless a specific case truly needs it (document the why in a comment).
- **Components by feature, not flat:** `components/student/`, `components/company/`, `components/admin/`, `components/counselor/`, `components/shared/`. Never one flat `components/` folder for everything.
- **One typed API client:** all HTTP goes through `lib/api-client.ts`. No scattered `fetch()` calls inside components.
- **Server Components by default.** Add `"use client"` only when interactivity (state, effects, event handlers) requires it.
- **Forms:** `react-hook-form` + `zod` schemas that **mirror the API's request DTOs** field-for-field. Reuse the same zod schema on the client (validation) and conceptually on the server (DTO binding).
- **Route Handlers** (`app/api/.../route.ts`) exist only to act as the BFF: hold the httpOnly cookie, attach the access token, proxy to the .NET API, and set refreshed cookies. **No business logic in Route Handlers.**

## 5. Database — 15 tables

| Table | Purpose | Key relationships |
|---|---|---|
| `Users` | Auth identity (email, password hash, role, verified flag) | 1:1 to `Students` or `Companies` |
| `Roles` | Lookup: Student, Company, Admin, Counselor | 1:N from `Users` |
| `Students` | Student profile (name, university, dept, CGPA, bio) | 1:1 `Users`, 1:N `Applications`, 1:N `Resumes`, 1:N `Assessments` |
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

## 6. Non-functional constraints

- **Performance:** page loads < 2s; APIs < 500ms p95 (AI calls excluded, those run async or via background job).
- **Password hashing:** PBKDF2 / SHA256 via ASP.NET Core Identity defaults. Do not roll your own.
- **Database queries:** EF Core / LINQ only — parameterized by construction. **Never raw SQL string interpolation.** If raw SQL is unavoidable, use `FromSqlInterpolated`.
- **AI calls:** always `await` (never block a request thread), always wrapped in `try/catch` with graceful fallback (return cached / default / "AI unavailable" message). Every call is logged to `AIHistory` with **real token-usage numbers** (prompt tokens, completion tokens, total) — never estimates.
- **Money / cost fields:** `decimal` / `numeric`, never `float` / `double`. AI cost in `AIHistory.CostUsd` is `decimal(18,6)`.

## 7. Git conventions

- **Branches:** one feature per branch, prefixed: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`, `test/`, `refactor/`, `style/`.
- **Commit messages:** Conventional Commits — `type(scope): description`. Imperative mood, lowercase, no trailing period.
  - Good: `feat(api): add job recommendation endpoint`
  - Bad:  `Added Job Recommendation Endpoint.`
- **PR title = commit message** when there's one commit; otherwise summarize the branch.

## 8. Do not

- Do not store JWTs in `localStorage` or non-httpOnly cookies.
- Do not call LLM APIs synchronously, blocking a request thread.
- Do not commit secrets, `.env*` files, or connection strings with credentials.
- Do not bypass the repository layer from controllers (no `DbContext` injection in controllers).
- Do not add business logic inside Next.js Route Handlers — BFF proxy/cookie handling only.
- Do not use `any` in TypeScript without a `// TODO: <reason>` justification comment.
- Do not catch exceptions and swallow them silently — log or rethrow; never an empty `catch {}` block.

## 9. When in doubt

If a later prompt's instructions seem to conflict with anything stated here, **flag the conflict in your response** rather than silently picking one. This file is the source of truth and should be updated (via a small follow-up commit) to reflect the new decision, not quietly overridden.

## 10. Visual Identity & Design System

- **Component Library:** shadcn/ui (using `@base-ui/react` primitives, i.e., `render` props instead of `asChild`).
- **Styling:** Tailwind CSS v4. Design tokens are defined via OKLCH variables in `web/app/globals.css`.
- **Colors:**
  - **Primary:** Deep Teal (trust, growth).
  - **Accent:** Warm Amber (action, warmth).
- **Typography:**
  - **Headings/Display:** Space Grotesk (`font-heading`).
  - **Body:** Inter (`font-sans`).
- **UI Details:**
  - **Border Radius:** Standardized on `0.5rem` (`rounded-lg`).
  - **Shadows/Elevation:** Subtle `shadow-sm border` combination (avoid heavy drop shadows).
  - **Icons:** `lucide-react` (16px for dense UI/tables, 20px for inline/nav).
- **Layout:**
  - Use `components/shared/page-container.tsx` (`<PageContainer>`) for standard content (max-w-7xl).
  - Header and footer use a wider edge-to-edge layout (`max-w-[1600px]`).
