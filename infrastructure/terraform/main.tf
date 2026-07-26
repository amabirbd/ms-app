terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      System      = "b2b-commerce"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

module "network" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name    = "b2b-${var.environment}"
  cidr    = "10.20.0.0/16"
  azs     = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets  = ["10.20.0.0/20", "10.20.16.0/20", "10.20.32.0/20"]
  public_subnets   = ["10.20.128.0/24", "10.20.129.0/24", "10.20.130.0/24"]
  database_subnets = ["10.20.192.0/24", "10.20.193.0/24", "10.20.194.0/24"]
  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"
  enable_dns_hostnames = true
}
