# InternLink

A platform connecting students with internship opportunities.

## Environment Setup

| Variable | Required For | Where to Get Value |
|----------|--------------|-------------------|
| APP_NAME | All environments | Project name (default: InternLink) |
| APP_ENV | All environments | Environment name: development, staging, production |
| APP_DEBUG | Development | true for dev, false for prod |
| APP_URL | All environments | Frontend URL (e.g., http://localhost:3000) |
| API_URL | All environments | Backend API URL (e.g., http://localhost:5000) |
| DB_HOST | All environments | PostgreSQL host (localhost for dev, cloud endpoint for prod) |
| DB_PORT | All environments | PostgreSQL port (default: 5432) |
| DB_NAME | All environments | Database name (internlink_dev, internlink_prod) |
| DB_USER | All environments | Database username |
| DB_PASSWORD | All environments | Database password (use secrets manager in prod) |
| DB_SSL_MODE | Production | disable, require, verify-ca, verify-full |
| REDIS_HOST | All environments | Redis host (localhost for dev) |
| REDIS_PORT | All environments | Redis port (default: 6379) |
| REDIS_PASSWORD | Production | Redis password (empty for local dev) |
| REDIS_DB | All environments | Redis database number (default: 0) |
| JWT_SECRET | All environments | **Generate with: `openssl rand -base64 32`** - MUST be unique per environment |
| JWT_ISSUER | All environments | Token issuer (e.g., InternLink) |
| JWT_AUDIENCE | All environments | Token audience (e.g., InternLink-Users) |
| JWT_ACCESS_TOKEN_EXPIRY_MINUTES | All environments | Access token TTL (default: 15) |
| JWT_REFRESH_TOKEN_EXPIRY_DAYS | All environments | Refresh token TTL (default: 7) |
| SMTP_HOST | Email features | SMTP server (smtp.gmail.com, smtp.ethereal.email for dev) |
| SMTP_PORT | Email features | SMTP port (587 for TLS, 465 for SSL) |
| SMTP_USER | Email features | SMTP username |
| SMTP_PASSWORD | Email features | SMTP password / app password |
| SMTP_FROM_EMAIL | Email features | Sender email address |
| SMTP_FROM_NAME | Email features | Sender name |
| FRONTEND_URL | CORS, Email links | Frontend URL (http://localhost:3000 for dev) |
| STORAGE_PROVIDER | File uploads | minio, s3, gcs, azure |
| STORAGE_ENDPOINT | File uploads | Storage endpoint (localhost:9000 for MinIO) |
| STORAGE_ACCESS_KEY | File uploads | Storage access key |
| STORAGE_SECRET_KEY | File uploads | Storage secret key |
| STORAGE_BUCKET | File uploads | Bucket name for uploads |
| STORAGE_REGION | File uploads | Storage region (us-east-1 for S3/MinIO) |
| STORAGE_USE_SSL | File uploads | true for production, false for local MinIO |
| GOOGLE_CLIENT_ID | Google OAuth | Google Cloud Console > Credentials |
| GOOGLE_CLIENT_SECRET | Google OAuth | Google Cloud Console > Credentials |
| LINKEDIN_CLIENT_ID | LinkedIn OAuth | LinkedIn Developer Portal |
| LINKEDIN_CLIENT_SECRET | LinkedIn OAuth | LinkedIn Developer Portal |
| JOB_QUEUE_CONNECTION_STRING | Background jobs | Redis connection string (redis://localhost:6379) |
| LOG_LEVEL | All environments | debug, info, warn, error |
| LOG_FORMAT | All environments | console, json |
| FEATURE_GOOGLE_AUTH | OAuth | true/false |
| FEATURE_LINKEDIN_AUTH | OAuth | true/false |
| FEATURE_EMAIL_VERIFICATION | Auth flow | true/false |
| FEATURE_FILE_UPLOAD | File uploads | true/false |
| RATE_LIMIT_REQUESTS_PER_MINUTE | API protection | Requests per minute per IP |
| RATE_LIMIT_BURST | API protection | Burst allowance |

## Quick Start

1. Copy `.env.example` to `.env.development`:
   ```bash
   cp .env.example .env.development
   ```

2. Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```
   Update `JWT_SECRET` in `.env.development` with the output.

3. Start infrastructure with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Verify services are healthy:
   ```bash
   docker-compose ps
   ```

5. Run database migrations (when available):
   ```bash
   # TODO: Add migration command
   ```

6. Start the application (when available):
   ```bash
   # TODO: Add dev server command
   ```

## Services (Docker Compose)

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching, sessions, job queue |
| MinIO | 9000 (API), 9001 (Console) | S3-compatible file storage |
| MailHog | 1025 (SMTP), 8025 (Web UI) | Email testing |

## Toolchain Requirements

| Tool | Minimum Version | Install Command |
|------|----------------|-----------------|
| .NET SDK | 8.0.x | `winget install Microsoft.DotNet.SDK.8` |
| Node.js | 20.x LTS | `winget install OpenJS.NodeJS.LTS` |
| npm | 10.x | Included with Node.js |
| Docker | 24.x | `winget install Docker.DockerDesktop` |
| dotnet-ef | 8.x | `dotnet tool install --global dotnet-ef` |
| Git | 2.x | `winget install Git.Git` |

Verify all tools:
```bash
dotnet --version && node --version && npm --version && docker --version && dotnet-ef --version && git --version
```