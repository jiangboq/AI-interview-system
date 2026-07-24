output "instance_id" {
  description = "EC2 instance ID (use with `aws ssm start-session --target`)"
  value       = aws_instance.app.id
}

output "elastic_ip" {
  description = "Public Elastic IP of the instance"
  value       = aws_eip.app.public_ip
}

output "backup_bucket" {
  description = "S3 bucket receiving nightly DB backups"
  value       = aws_s3_bucket.backups.bucket
}

output "urls" {
  description = "Public URLs for the deployed services"
  value = {
    web     = "https://app.${var.domain_name}"
    api     = "https://api.${var.domain_name}"
    livekit = "wss://livekit.${var.domain_name}"
  }
}
