variable "aws_region" {
  default = "ap-south-1"
}

variable "ami_id" {
  description = "Ubuntu 24.04 AMI ID in selected region"
  type        = string
  default     = "ami-0c7632fb77f35db43"
}

variable "instance_type" {
  default = "t3.small"
}

variable "key_name" {
  description = "Existing AWS EC2 key pair name"
  type        = string
  default     = "Linux_key"
}

variable "admin_ip" {
  description = "Your public IP in CIDR format"
  type        = string
  default     = "152.57.87.138/32"
}
