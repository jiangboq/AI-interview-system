#!/usr/bin/env bash
# Pulls the latest code, refreshes secrets from SSM, and rebuilds/restarts
# the stack. Safe to re-run for every deploy (run manually via SSM Session
# Manager, or let bootstrap call it once on first boot).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$APP_DIR"

git pull --ff-only

./infra/scripts/render-env.sh

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker image prune -f
