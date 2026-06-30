#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore_db.sh <backup-file.sql>"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "Backup file not found: $1"
  exit 1
fi

source .env

echo "Restoring database from $1"

docker compose exec -T db psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker compose exec -T db psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

cat "$1" | docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME"

echo "Restore completed"