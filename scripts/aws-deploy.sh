#!/bin/bash

# AWS Deployment Script for Conference Room Booking System
# This script automates the AWS infrastructure setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
export AWS_REGION="${AWS_REGION:-us-east-1}"
export PROJECT_NAME="conference-booking"
export CLUSTER_NAME="conference-booking-cluster"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Conference Room Booking System${NC}"
echo -e "${GREEN}AWS Deployment Script${NC}"
echo -e "${GREEN}================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    exit 1
fi

# Get AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account ID: $AWS_ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ Region: $AWS_REGION${NC}"

# Function to create ECR repositories
create_ecr_repositories() {
    echo -e "\n${YELLOW}Creating ECR repositories...${NC}"
    
    services=("api-gateway" "auth-service" "room-service" "booking-service" "weather-service" "notification-service")
    
    for service in "${services[@]}"; do
        echo "Creating repository: $PROJECT_NAME/$service"
        aws ecr create-repository \
            --repository-name $PROJECT_NAME/$service \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            2>/dev/null || echo "Repository $service already exists"
    done
    
    echo -e "${GREEN}✓ ECR repositories created${NC}"
}

# Function to build and push Docker images
build_and_push_images() {
    echo -e "\n${YELLOW}Building and pushing Docker images...${NC}"
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin \
        $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    services=("api-gateway" "auth-service" "room-service" "booking-service" "weather-service" "notification-service")
    
    for service in "${services[@]}"; do
        echo -e "\n${YELLOW}Building $service...${NC}"
        
        docker build -t $PROJECT_NAME/$service:latest ./services/$service
        
        docker tag $PROJECT_NAME/$service:latest \
            $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/$service:latest
        
        echo "Pushing $service to ECR..."
        docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/$service:latest
        
        echo -e "${GREEN}✓ $service pushed${NC}"
    done
    
    echo -e "${GREEN}✓ All images built and pushed${NC}"
}

# Function to create VPC and networking
create_vpc() {
    echo -e "\n${YELLOW}Creating VPC and networking...${NC}"
    
    # Check if VPC already exists
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=$PROJECT_NAME-vpc" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)
    
    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
        # Create VPC
        VPC_ID=$(aws ec2 create-vpc \
            --cidr-block 10.0.0.0/16 \
            --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$PROJECT_NAME-vpc}]" \
            --query 'Vpc.VpcId' \
            --output text \
            --region $AWS_REGION)
        
        echo -e "${GREEN}✓ VPC created: $VPC_ID${NC}"
        
        # Enable DNS hostnames
        aws ec2 modify-vpc-attribute \
            --vpc-id $VPC_ID \
            --enable-dns-hostnames \
            --region $AWS_REGION
    else
        echo -e "${GREEN}✓ Using existing VPC: $VPC_ID${NC}"
    fi
    
    export VPC_ID
    
    # Create subnets, internet gateway, etc.
    # (Full implementation in the AWS-DEPLOYMENT-GUIDE.md)
}

# Function to create ECS cluster
create_ecs_cluster() {
    echo -e "\n${YELLOW}Creating ECS cluster...${NC}"
    
    aws ecs create-cluster \
        --cluster-name $CLUSTER_NAME \
        --region $AWS_REGION \
        --capacity-providers FARGATE \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
        2>/dev/null || echo "Cluster already exists"
    
    echo -e "${GREEN}✓ ECS cluster created${NC}"
}

# Function to create CloudWatch log group
create_log_group() {
    echo -e "\n${YELLOW}Creating CloudWatch log group...${NC}"
    
    aws logs create-log-group \
        --log-group-name /ecs/$PROJECT_NAME \
        --region $AWS_REGION \
        2>/dev/null || echo "Log group already exists"
    
    echo -e "${GREEN}✓ CloudWatch log group created${NC}"
}

# Main menu
show_menu() {
    echo -e "\n${YELLOW}What would you like to do?${NC}"
    echo "1) Create ECR repositories"
    echo "2) Build and push Docker images"
    echo "3) Create VPC and networking (requires Terraform)"
    echo "4) Create ECS cluster"
    echo "5) Create CloudWatch log group"
    echo "6) Full deployment (steps 1-5)"
    echo "7) Exit"
    echo -n "Enter choice: "
}

# Main execution
if [ "$1" == "--full" ]; then
    create_ecr_repositories
    build_and_push_images
    create_vpc
    create_ecs_cluster
    create_log_group
    
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN}Deployment completed!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo -e "\nNext steps:"
    echo -e "1. Update GitHub Secrets with your AWS credentials"
    echo -e "2. Push to main branch to trigger CI/CD"
    echo -e "3. Monitor deployment in GitHub Actions"
    
else
    while true; do
        show_menu
        read choice
        
        case $choice in
            1) create_ecr_repositories ;;
            2) build_and_push_images ;;
            3) create_vpc ;;
            4) create_ecs_cluster ;;
            5) create_log_group ;;
            6)
                create_ecr_repositories
                build_and_push_images
                create_vpc
                create_ecs_cluster
                create_log_group
                ;;
            7) break ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
    done
fi

