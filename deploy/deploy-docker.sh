#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ ! -f .env.production ]; then
  echo "Missing .env.production. Create it from .env.production.example before deploying." >&2
  exit 1
fi

npm ci
npm run build:frontend
docker compose -f "$COMPOSE_FILE" build
docker compose -f "$COMPOSE_FILE" up -d
docker compose -f "$COMPOSE_FILE" ps
