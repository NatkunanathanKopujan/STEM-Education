# Troubleshooting Guide

## Database Connection Errors

- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
- Verify MySQL is running and reachable.
- Confirm schema has been applied.
- Check `/health/database`.

## AI Errors

- Confirm `AI_PROVIDER` and provider-specific keys/models.
- Check provider timeout and retry settings.
- Use local provider for development and CI.
- Review AI generation logs.

## Upload Errors

- Check `MAX_FILE_SIZE_MB`.
- Verify `backend/uploads` exists and is writable.
- Confirm Nginx `client_max_body_size`.
- Ensure file type is supported.

## Login and JWT Errors

- Confirm `JWT_SECRET` is configured.
- Check account status.
- Review `login_attempts`.
- Ensure frontend sends `Authorization: Bearer <token>`.

## CORS Errors

- Set `CLIENT_URL` to the exact frontend origin.
- Ensure reverse proxy preserves protocol headers.

## Docker Errors

- Verify Docker and Docker Compose are installed.
- Check `.env.production`.
- Run `docker compose logs backend mysql nginx`.

## Build Errors

- Run `npm ci`.
- Ensure Node.js 20 is used.
- Delete stale `node_modules` only when necessary and reinstall.

## Deployment Errors

- Check Nginx config syntax.
- Check PM2 status/logs.
- Verify health endpoints.
- Confirm persistent volumes are mounted.
