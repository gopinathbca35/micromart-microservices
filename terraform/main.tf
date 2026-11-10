terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_ecr_repository" "user" {
  name         = "user-service"
  force_delete = true
}

resource "aws_ecr_repository" "product" {
  name         = "product-service"
  force_delete = true
}

resource "aws_ecr_repository" "order" {
  name         = "order-service"
  force_delete = true
}

resource "aws_ecr_repository" "frontend" {
  name         = "frontend-service"
  force_delete = true
}

resource "aws_security_group" "app_sg" {
  name        = "microservices-sg"
  description = "Microservices EC2 access"

  ingress {
    description = "SSH from approved IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip]
  }

  ingress {
    description = "HTTP application"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "microservices-sg"
  }
}

resource "aws_instance" "app" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name = "microservices-app"
  }
}
