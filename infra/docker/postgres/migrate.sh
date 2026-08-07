#!/usr/bin/env bash
# Applies any *.sql file in /migrations that isn't yet recorded in the
# schema_migrations table, in filename order. Safe to re-run: already
# applied migrations are skipped, so this can run on every `docker compose up`.
set -euo pipefail

: "${PGHOST:?}" "${PGUSER:?}" "${PGDATABASE:?}"

echo "Waiting for postgres at $PGHOST..."
for _ in $(seq 1 60); do
  if pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" >/dev/null

psql -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

shopt -s nullglob
for f in /migrations/*.sql; do
  version="$(basename "$f")"

  # `-c` does NOT run its SQL text through psql's :'var' interpolation (only
  # backslash meta-commands get that treatment there) - only script input
  # (stdin/-f) does, hence piping these through stdin instead of -c.
  applied="$(psql -tAq -v ON_ERROR_STOP=1 -v version="$version" <<'SQL'
SELECT 1 FROM schema_migrations WHERE version = :'version';
SQL
)"
  if [ "$applied" = "1" ]; then
    echo "skip  $version (already applied)"
    continue
  fi

  echo "apply $version"
  psql -v ON_ERROR_STOP=1 -q -1 -v version="$version" -f "$f" -f - <<'SQL'
INSERT INTO schema_migrations (version) VALUES (:'version');
SQL
done

echo "Migrations up to date."
