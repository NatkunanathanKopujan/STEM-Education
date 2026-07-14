# Configuration Guide

## Environment Files

Use templates according to target environment:

- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`
- `backend/.env.example`

Copy the appropriate template and fill in real values. Never commit real secrets.

## Required Variables

- `JWT_SECRET`: required for token signing.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: MySQL connection.
- `CLIENT_URL`: allowed frontend origin for CORS.

## AI Variables

- `AI_PROVIDER`: `local`, `openai`, `gemini`, or `ollama`.
- Provider keys and models are configured through `OPENAI_*`, `GEMINI_*`, and `OLLAMA_*` variables.
- `AI_TIMEOUT`, `AI_MAX_RETRIES`, and `AI_BATCH_SIZE` control reliability and throughput.

## Storage Variables

- `STORAGE_PROVIDER`: currently local, future-ready for cloud storage.
- `STORAGE_LOCAL_BASE_URL`: public base URL for uploaded files.
- `MAX_FILE_SIZE_MB`: upload limit.

## Security Variables

- `MAX_FAILED_LOGIN_ATTEMPTS`
- `LOGIN_LOCKOUT_WINDOW_MINUTES`
- `API_RATE_LIMIT_WINDOW_MS`
- `API_RATE_LIMIT_MAX`

## Performance Variables

- `CACHE_PROVIDER`
- `CACHE_DEFAULT_TTL_SECONDS`
- `SLOW_REQUEST_THRESHOLD_MS`
- `SLOW_QUERY_THRESHOLD_MS`

## Production Notes

- Use unique secrets for each environment.
- Restrict database access to trusted hosts.
- Use HTTPS behind Nginx or a cloud load balancer.
- Store production `.env` values in secret managers where available.
