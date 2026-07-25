#!/usr/bin/env bash
# Fetches every secret/config value Terraform pushed to SSM Parameter Store
# and writes them out as .env files Docker Compose can consume, then renders
# the LiveKit config with the real API key/secret baked in.
set -euo pipefail

SSM_PREFIX="${SSM_PREFIX:-/interview-app/prod}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ENV_FILE="$APP_DIR/.env"
PROD_ENV_FILE="$APP_DIR/configs/prod.env"

mkdir -p "$APP_DIR/configs"
umask 077
: > "$ENV_FILE"

aws ssm get-parameters-by-path \
  --path "$SSM_PREFIX" \
  --with-decryption \
  --query "Parameters[].{Name:Name,Value:Value}" \
  --output json \
  | jq -r '.[] | "\(.Name | split("/") | last)=\(.Value)"' \
  >> "$ENV_FILE"

cp "$ENV_FILE" "$PROD_ENV_FILE"
chmod 600 "$ENV_FILE" "$PROD_ENV_FILE"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

envsubst '${LIVEKIT_API_KEY} ${LIVEKIT_API_SECRET}' \
  < "$APP_DIR/infra/docker/livekit/livekit.prod.yaml.tpl" \
  > "$APP_DIR/infra/docker/livekit/livekit.generated.yaml"
