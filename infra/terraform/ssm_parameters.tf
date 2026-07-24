# All values the instance needs at deploy time (both secrets and small bits of
# derived config) live under one SSM path so infra/scripts/render-env.sh can
# fetch everything with a single get-parameters-by-path call and write it out
# as configs/prod.env. Terraform is the source of truth for these values.

locals {
  ssm_values = {
    POSTGRES_USER       = var.postgres_user
    POSTGRES_PASSWORD   = var.postgres_password
    POSTGRES_DB         = var.postgres_db
    MONGO_ROOT_USERNAME = var.mongo_root_username
    MONGO_ROOT_PASSWORD = var.mongo_root_password
    SECRET_KEY          = var.secret_key
    ANTHROPIC_API_KEY   = var.anthropic_api_key
    ANTHROPIC_MODEL     = var.anthropic_model
    OPENAI_API_KEY      = var.openai_api_key
    LIVEKIT_API_KEY     = var.livekit_api_key
    LIVEKIT_API_SECRET  = var.livekit_api_secret
    LIVEKIT_URL         = "wss://livekit.${var.domain_name}"
    SPLUNK_HEC_URL      = var.splunk_hec_url
    SPLUNK_HEC_TOKEN    = var.splunk_hec_token
    NEXT_PUBLIC_API_URL = "https://api.${var.domain_name}"
    DOMAIN_NAME         = var.domain_name
    CADDY_ACME_EMAIL    = var.caddy_acme_email
    GITHUB_PAT          = var.github_pat
  }
}

resource "aws_ssm_parameter" "app" {
  for_each = local.ssm_values

  name  = "${local.ssm_prefix}/${each.key}"
  type  = "SecureString"
  value = each.value

  tags = {
    Project = var.project_name
  }
}
