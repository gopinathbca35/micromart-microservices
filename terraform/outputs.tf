output "ec2_public_ip" {
  value = aws_instance.app.public_ip
}

output "ec2_instance_id" {
  value = aws_instance.app.id
}

output "user_ecr_url" {
  value = aws_ecr_repository.user.repository_url
}

output "product_ecr_url" {
  value = aws_ecr_repository.product.repository_url
}

output "order_ecr_url" {
  value = aws_ecr_repository.order.repository_url
}

output "frontend_ecr_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}
