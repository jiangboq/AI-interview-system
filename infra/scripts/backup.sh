#!/usr/bin/env bash
# Nightly Postgres + MongoDB dump, gzipped and pushed to S3. The bucket has a
# lifecycle rule (Terraform-managed) that expires objects automatically, so
# this script doesn't need to worry about pruning old backups itself.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$APP_DIR"

BUCKET="$(cat /etc/interview-app/backup-bucket)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$TMP_DIR/postgres-$TIMESTAMP.sql.gz"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T mongo \
  mongodump --username "$MONGO_ROOT_USERNAME" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --archive | gzip > "$TMP_DIR/mongo-$TIMESTAMP.archive.gz"

aws s3 cp "$TMP_DIR/postgres-$TIMESTAMP.sql.gz" "s3://$BUCKET/postgres/postgres-$TIMESTAMP.sql.gz"
aws s3 cp "$TMP_DIR/mongo-$TIMESTAMP.archive.gz" "s3://$BUCKET/mongo/mongo-$TIMESTAMP.archive.gz"
