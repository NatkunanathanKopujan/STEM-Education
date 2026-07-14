#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./deploy/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -z "${DB_NAME:-}" ] || [ -z "${DB_USER:-}" ]; then
  echo "DB_NAME and DB_USER are required for database backup." >&2
  exit 1
fi

mysqldump \
  -h "${DB_HOST:-localhost}" \
  -P "${DB_PORT:-3306}" \
  -u "$DB_USER" \
  "-p${DB_PASSWORD:-}" \
  "$DB_NAME" > "$BACKUP_DIR/db-$STAMP.sql"

tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C backend uploads
tar -czf "$BACKUP_DIR/config-$STAMP.tar.gz" .env.production docker-compose.prod.yml nginx

echo "Backup completed in $BACKUP_DIR"
