#!/usr/bin/env bash
# Terraform-templated EC2 user_data. Runs once as root on first boot.
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive
export AWS_DEFAULT_REGION="${aws_region}"

export SSM_PREFIX="${ssm_prefix}"
GITHUB_REPO="${github_repo}"
GIT_BRANCH="${git_branch}"
APP_DIR=/opt/app

mkdir -p /etc/interview-app
echo "${backup_bucket}" > /etc/interview-app/backup-bucket

# ── Base packages ────────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg git unzip jq gettext-base cron

# ── Docker Engine + Compose plugin (official repo) ─────────────────────────
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y --no-install-recommends \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# ── AWS CLI v2 ───────────────────────────────────────────────────────────────
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

# ── Clone the app repo ───────────────────────────────────────────────────────
GITHUB_PAT="$(aws ssm get-parameter --name "$SSM_PREFIX/GITHUB_PAT" --with-decryption --query Parameter.Value --output text 2>/dev/null || true)"

if [ -n "$GITHUB_PAT" ] && [ "$GITHUB_PAT" != "None" ]; then
  CLONE_URL="https://x-access-token:$GITHUB_PAT@github.com/$GITHUB_REPO.git"
else
  CLONE_URL="https://github.com/$GITHUB_REPO.git"
fi

if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$GIT_BRANCH" "$CLONE_URL" "$APP_DIR"
fi

chmod +x "$APP_DIR"/infra/scripts/*.sh

# ── First deploy ─────────────────────────────────────────────────────────────
"$APP_DIR"/infra/scripts/deploy.sh

# ── Nightly backup cron ──────────────────────────────────────────────────────
( crontab -l 2>/dev/null | grep -v backup.sh ; echo "0 3 * * * $APP_DIR/infra/scripts/backup.sh >> /var/log/backup.log 2>&1" ) | crontab -
