#!/bin/bash

# DynamoDB to GitHub Sync Deployment Script
# This script sets up the infrastructure for syncing DynamoDB changes to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="openmed-dynamodb-sync"
REGION="us-east-1"
TEMPLATE_FILE="infrastructure/dynamodb-github-sync.yaml"

echo -e "${GREEN}🚀 OpenMed DynamoDB to GitHub Sync Deployment${NC}"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if required parameters are provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN environment variable is not set.${NC}"
    echo "Please set it with: export GITHUB_TOKEN=your_github_token"
    echo "You can create a token at: https://github.com/settings/tokens"
    exit 1
fi

if [ -z "$GITHUB_REPO" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_REPO environment variable is not set.${NC}"
    echo "Setting default: FormidableCare/OpenMed-Data"
    export GITHUB_REPO="FormidableCare/OpenMed-Data"
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ Template file not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Deploy CloudFormation stack
echo -e "${YELLOW}📦 Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --parameter-overrides \
        GitHubToken="$GITHUB_TOKEN" \
        GitHubRepo="$GITHUB_REPO" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset

echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"
echo ""

# Get stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"
DYNAMODB_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
    --output text)

LAMBDA_FUNCTION=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text)

echo -e "${GREEN}✅ Stack outputs retrieved${NC}"
echo ""

# Update Lambda function with actual code
echo -e "${YELLOW}🔧 Updating Lambda function with sync code...${NC}"

# Create deployment package
echo "Creating deployment package..."
cd scripts
zip -r dynamodb-github-sync.zip dynamodb-github-sync.py
cd ..

# Update Lambda function
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION" \
    --zip-file fileb://scripts/dynamodb-github-sync.zip \
    --region "$REGION"

echo -e "${GREEN}✅ Lambda function updated${NC}"
echo ""

# Test the setup
echo -e "${YELLOW}🧪 Testing the setup...${NC}"

# Create a test item in DynamoDB
TEST_ID="test-$(date +%s)"
TEST_ITEM=$(cat <<EOF
{
    "id": "$TEST_ID",
    "name": "Test Medication",
    "status": "active",
    "category": "Test",
    "manufacturer": {
        "name": "Test Manufacturer",
        "country": "IL"
    },
    "composition": [
        {
            "substance": "Test Substance",
            "concentration": {
                "value": 100,
                "unit": "mg"
            }
        }
    ],
    "meta": {
        "version": "1.0",
        "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
}
EOF
)

echo "Creating test item in DynamoDB..."
aws dynamodb put-item \
    --table-name "$DYNAMODB_TABLE" \
    --item "$TEST_ITEM" \
    --region "$REGION"

echo -e "${GREEN}✅ Test item created${NC}"
echo ""

# Wait a moment for the sync to process
echo "Waiting for sync to process..."
sleep 10

# Check Lambda logs
echo -e "${YELLOW}📊 Checking Lambda logs...${NC}"
aws logs describe-log-streams \
    --log-group-name "/aws/lambda/$LAMBDA_FUNCTION" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --region "$REGION" > /dev/null 2>&1

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}🎉 DynamoDB to GitHub sync is now active!${NC}"
echo ""
echo "📋 Summary:"
echo "  • DynamoDB Table: $DYNAMODB_TABLE"
echo "  • Lambda Function: $LAMBDA_FUNCTION"
echo "  • GitHub Repo: $GITHUB_REPO"
echo "  • Region: $REGION"
echo ""
echo "🔗 Next steps:"
echo "  1. Update your app to use DynamoDB instead of files"
echo "  2. Test the sync by creating/updating items"
echo "  3. Check GitHub for the synced files"
echo ""
echo "💡 To monitor the sync:"
echo "  aws logs tail /aws/lambda/$LAMBDA_FUNCTION --follow --region $REGION"
echo ""
echo "🧹 To clean up test data:"
echo "  aws dynamodb delete-item --table-name $DYNAMODB_TABLE --key '{\"id\":{\"S\":\"$TEST_ID\"}}' --region $REGION" 