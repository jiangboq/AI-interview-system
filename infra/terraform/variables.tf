variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to prefix/tag all resources"
  type        = string
  default     = "interview-app"
}

variable "instance_type" {
  description = "EC2 instance type. Bump to t3.xlarge if voice-agent + LiveKit + DBs get memory-constrained."
  type        = string
  default     = "t3.large"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size (gp3), in GB"
  type        = number
  default     = 100
}

variable "domain_name" {
  description = "Root domain, already hosted in Route 53 (e.g. example.com). app./api./livekit. subdomains are created under it."
  type        = string
}

variable "caddy_acme_email" {
  description = "Email address Caddy uses to register Let's Encrypt certificates"
  type        = string
}

variable "backup_retention_days" {
  description = "Number of days to retain nightly DB backups in S3 before they expire"
  type        = number
  default     = 14
}

# ── Secrets (stored as SSM SecureString parameters, read by the instance) ────

variable "postgres_user" {
  description = "Postgres application user"
  type        = string
  default     = "interview"
}

variable "postgres_password" {
  description = "Postgres application user password"
  type        = string
  sensitive   = true
}

variable "postgres_db" {
  description = "Postgres database name"
  type        = string
  default     = "interview"
}

variable "mongo_root_username" {
  description = "MongoDB root username"
  type        = string
  default     = "interview"
}

variable "mongo_root_password" {
  description = "MongoDB root password"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "API JWT signing secret"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "livekit_api_key" {
  description = "LiveKit API key"
  type        = string
  sensitive   = true
}

variable "livekit_api_secret" {
  description = "LiveKit API secret"
  type        = string
  sensitive   = true
}

variable "splunk_hec_url" {
  description = "Splunk HTTP Event Collector URL (e.g. https://http-inputs-xxx.splunkcloud.com:443)"
  type        = string
  sensitive   = true
}

variable "splunk_hec_token" {
  description = "Splunk HTTP Event Collector token"
  type        = string
  sensitive   = true
}

variable "anthropic_model" {
  description = "Anthropic model id used by the API/voice-agent"
  type        = string
  default     = ""
}

variable "github_pat" {
  description = "Optional GitHub fine-grained PAT (read-only, repo-scoped) used to clone the repo if it's private. Leave empty for a public repo."
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_repo" {
  description = "GitHub repo (owner/name) to clone onto the instance"
  type        = string
  default     = "jiangboq/AI-interview-system"
}

variable "git_branch" {
  description = "Branch to deploy"
  type        = string
  default     = "main"
}

locals {
  ssm_prefix = "/${var.project_name}/prod"
}
