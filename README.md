# InternLink

[![CI](https://github.com/Mahimrio/InternLink/actions/workflows/ci.yml/badge.svg)](https://github.com/Mahimrio/InternLink/actions/workflows/ci.yml)

A platform connecting students with internship opportunities.

## Local Development — Two Workflows

### Workflow A: Fully offline with local PostgreSQL (default)

```bash
# 1. Copy compose env template and edit if needed
cp .env.example .env

# 2. Build and start both API and local DB
docker compose up --build
# API on http://localhost:8080, Postgres on localhost:5432 (internal only)
# The API connects to the "db" service via its compose-internal hostname
```

The `docker-compose.yml` uses `depends_on: db` with a healthcheck, so the API waits until Postgres is ready. The connection string is assembled from `POSTGRES_*` vars in `.env`.

### Workflow B: Point API at your Supabase dev project (no local DB)

```bash
# 1. Copy .env.example to .env and fill in your Supabase credentials
cp .env.example .env
# Edit .env: set POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB to your Supabase values
# (Host/port are in the Supabase dashboard → Settings → Database)

# 2. Start only the API (omit the db service)
docker compose up --build api
# API on http://localhost:8080, connects directly to your Supabase Postgres
```

**Switching between them is a one-line `.env` change** — no code or compose file edits.

## Local Development (without Docker)

**API:**
```bash
cd api
dotnet restore
dotnet run
# Runs on http://localhost:5000 (HTTP) / https://localhost:5001 (HTTPS)
```

**Web:**
```bash
cd web
npm ci
npm run dev
# Runs on http://localhost:3000
```

## Prerequisites

- Docker Desktop (includes Docker Compose)
- .NET 8 SDK (for local API development)
- Node.js 20+ (for local web development)

## Environment Variables

See `.env.example` for all configurable options. Required for local dev:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — from docker-compose or your own Postgres
- `JWT_SECRET` — generate with `openssl rand -base64 32`
- `SMTP_*` — use MailHog (included in docker-compose) for local email testing

## Architecture

- **Frontend**: Next.js 14+ (App Router, TypeScript, Tailwind) on Vercel
- **Backend**: ASP.NET Core 8 Web API (Dockerized) on Render
- **Database**: Supabase PostgreSQL via EF Core / Npgsql
- **Auth**: JWT access tokens (15 min) + httpOnly refresh cookies (7 days), BFF via Next.js Route Handlers

## CI

Runs on every push/PR to `main`:
- `api-build`: .NET 8 restore + release build + Docker image build
- `web-build`: Node 20, `npm ci`, lint, build
- Both jobs spin up a `postgres:16-alpine` service container for integration parity