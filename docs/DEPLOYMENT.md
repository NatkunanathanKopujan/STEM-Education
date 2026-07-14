# DBITLMS Deployment Guide

## Overview

DBITLMS can run on Ubuntu servers, VPS hosts, cloud VMs, Docker, or Docker Compose. The production shape is:

- Nginx serves the React build and proxies API/upload/health traffic.
- Node.js runs the backend API.
- MySQL stores application data.
- `backend/uploads` is persistent storage for local file uploads.
- Environment files provide secrets and runtime configuration.

## Environment Configuration

Copy one template and fill in real values:

```bash
cp .env.production.example .env.production
```

Never commit real `.env`, `.env.production`, API keys, database passwords, or JWT secrets.

Required production values:

- `JWT_SECRET`: use a long random secret.
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- `CLIENT_URL`: public frontend URL.
- `STORAGE_LOCAL_BASE_URL`: public backend or site URL for uploaded file links.

## Docker Deployment

Build and start the production stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check health:

```bash
curl http://localhost/health
curl http://localhost/health/database
curl http://localhost/health/storage
curl http://localhost/health/system
```

Persistent volumes:

- `mysql-prod-data`: MySQL data.
- `uploads-prod-data`: uploaded LMS files.
- `backend-prod-logs`: backend logs.
- `nginx-prod-logs`: reverse proxy logs.

## Development Docker

```bash
cp .env.development.example .env.development
docker compose -f docker-compose.dev.yml up
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Ubuntu Server Setup

Install dependencies:

```bash
sudo apt update
sudo apt install -y nginx mysql-server nodejs npm
npm install -g pm2
```

Install app dependencies and build:

```bash
npm ci
npm run build:frontend
```

Create backend env:

```bash
cp .env.production.example backend/.env
```

Start with PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Nginx

Use `nginx/lms.conf` as the base server config. For HTTPS, terminate TLS at Nginx and add certificates under `/etc/nginx/certs` or use Certbot.

Important settings included:

- Static asset caching.
- API reverse proxy.
- Upload proxying.
- Large upload support.
- Rate limiting.
- Security headers.
- WebSocket upgrade headers for future real-time modules.

## PM2

`ecosystem.config.cjs` runs the API in cluster mode with:

- Auto restart.
- Memory restart limit.
- Graceful shutdown timeout.
- Structured log paths.
- `WEB_CONCURRENCY` support.

Useful commands:

```bash
pm2 status
pm2 logs dbitlms-api
pm2 reload ecosystem.config.cjs
```

## Health APIs

Public operational endpoints:

- `GET /health`
- `GET /health/database`
- `GET /health/storage`
- `GET /health/ai`
- `GET /health/system`

`/health` is a liveness response. Dependency-specific endpoints return `503` if that component is unavailable.

## Backups

Run:

```bash
sh deploy/backup.sh
```

The script prepares:

- MySQL dump.
- Uploaded files archive.
- Deployment configuration archive.

Set `BACKUP_DIR` to redirect backup output.

## CI/CD

`.github/workflows/ci.yml` prepares:

- Dependency installation.
- Lint.
- Coverage tests.
- Frontend build.
- Docker image build.
- Manual production approval gate.

Provider-specific deployment steps can be added after the approval job.

## Monitoring

`monitoring/prometheus.yml` is a future-ready scrape config for health endpoints. The existing performance dashboard exposes API, cache, AI, upload/download, memory, and slow request data inside the LMS.

## Scaling

Future-ready scaling path:

- Increase PM2 `WEB_CONCURRENCY`.
- Run multiple backend containers behind Nginx or a cloud load balancer.
- Move sessions/cache to Redis.
- Move async workloads to queues.
- Move uploads to S3, Azure Blob, Cloudinary, or another storage provider.
- Add read replicas for reporting-heavy workloads.

## Upgrade Procedure

1. Back up database, uploads, and config.
2. Pull or deploy the new artifact.
3. Install dependencies.
4. Run migrations/schema updates if provided.
5. Build frontend.
6. Reload PM2 or restart Docker Compose.
7. Verify `/health` and critical user workflows.

## Troubleshooting

- `JWT_SECRET` missing: create `.env.production` or `backend/.env`.
- Database health fails: check MySQL credentials, host, firewall, and schema.
- Uploads fail: verify persistent volume permissions and `MAX_FILE_SIZE_MB`.
- Nginx 413 errors: confirm `client_max_body_size`.
- Frontend route 404: ensure `try_files $uri /index.html` exists.
- Docker startup loops: inspect `docker compose logs backend mysql nginx`.
