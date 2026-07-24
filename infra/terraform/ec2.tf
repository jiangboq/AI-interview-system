resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.instance.id]
  iam_instance_profile   = aws_iam_instance_profile.instance.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens = "required" # IMDSv2 only
  }

  user_data = templatefile("${path.module}/templates/bootstrap.sh.tpl", {
    ssm_prefix    = local.ssm_prefix
    aws_region    = var.aws_region
    github_repo   = var.github_repo
    git_branch    = var.git_branch
    backup_bucket = aws_s3_bucket.backups.bucket
  })
  user_data_replace_on_change = true

  tags = {
    Name    = "${var.project_name}-instance"
    Project = var.project_name
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}
