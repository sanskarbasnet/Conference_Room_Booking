# PowerShell script to redeploy notification service to AWS ECS
# Usage: .\scripts\redeploy-notification-service.ps1

$ErrorActionPreference = "Stop"

# Configuration
$AWS_REGION = "us-east-1"
$AWS_ACCOUNT_ID = "997167341062"
$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$IMAGE_NAME = "conference-v2/notification-service"
$IMAGE_TAG = "latest"
$ECS_CLUSTER = "conference-cluster-v2"
$ECS_SERVICE = "notification-service-v2"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Redeploying Notification Service" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Login to ECR
Write-Host "`nLogging in to ECR..." -ForegroundColor Yellow
$loginCommand = aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to login to ECR" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Logged in to ECR" -ForegroundColor Green

# Build Docker image
Write-Host "`nBuilding Docker image..." -ForegroundColor Yellow
docker build -t "$ECR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG" ./services/notification-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build Docker image" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built" -ForegroundColor Green

# Push Docker image
Write-Host "`nPushing Docker image to ECR..." -ForegroundColor Yellow
docker push "$ECR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push Docker image" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image pushed" -ForegroundColor Green

# Force new ECS deployment
Write-Host "`nForcing new ECS deployment..." -ForegroundColor Yellow
aws ecs update-service `
    --cluster $ECS_CLUSTER `
    --service $ECS_SERVICE `
    --force-new-deployment `
    --region $AWS_REGION
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to update ECS service" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ECS service update initiated" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment initiated successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nThe notification service is being redeployed." -ForegroundColor Cyan
Write-Host "You can monitor the deployment in the AWS ECS console." -ForegroundColor Cyan
Write-Host "`nTo check deployment status, run:" -ForegroundColor Yellow
Write-Host "aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION" -ForegroundColor Gray

