# DynamoDB to GitHub Sync for OpenMed

This setup provides a solution for syncing DynamoDB changes to GitHub for audit trail purposes, while keeping your application fast and responsive.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   DynamoDB      │    │   GitHub        │
│   (Next.js)     │◄──►│   (Fast DB)     │◄──►│   (Audit Trail) │
│                 │    │                 │    │                 │
│ • Instant saves │    │ • < 50ms        │    │ • Full history  │
│ • Real-time     │    │ • Concurrent    │    │ • Versioning    │
│ • No rebuilds   │    │ • Scalable      │    │ • Rollback      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Lambda        │
                       │   (Sync Engine) │
                       │                 │
                       │ • Auto-trigger  │
                       │ • Background    │
                       │ • Reliable      │
                       └─────────────────┘
```

## 🚀 Benefits

- ✅ **Fast Access**: DynamoDB queries in < 50ms
- ✅ **Real-time Updates**: Changes are immediate
- ✅ **Full Audit Trail**: Every change tracked in Git
- ✅ **Cost Effective**: Pay only for what you use
- ✅ **Scalable**: Handles concurrent users
- ✅ **Reliable**: AWS managed infrastructure

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **GitHub Personal Access Token** with repo permissions
4. **GitHub Repository** for data storage

## 🛠️ Setup Instructions

### 1. Create GitHub Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. Copy the token

### 2. Set Environment Variables

```bash
export GITHUB_TOKEN="your_github_token_here"
export GITHUB_REPO="FormidableCare/OpenMed-Data"  # Optional, defaults to this
```

### 3. Deploy Infrastructure

```bash
# Run the deployment script
./scripts/deploy-dynamodb-sync.sh
```

This will:

- Create DynamoDB table
- Deploy Lambda function
- Set up DynamoDB Streams
- Configure IAM permissions
- Test the setup

### 4. Verify Setup

Check that the sync is working:

```bash
# Monitor Lambda logs
aws logs tail /aws/lambda/openmed-dynamodb-github-sync --follow --region us-east-1

# Check GitHub repository for synced files
# Visit: https://github.com/FormidableCare/OpenMed-Data/tree/main/catalog
```

## 🔧 Configuration

### Environment Variables

| Variable         | Description                    | Default                       |
| ---------------- | ------------------------------ | ----------------------------- |
| `GITHUB_TOKEN`   | GitHub Personal Access Token   | Required                      |
| `GITHUB_REPO`    | GitHub repository (owner/repo) | `FormidableCare/OpenMed-Data` |
| `GITHUB_BRANCH`  | GitHub branch name             | `main`                        |
| `DYNAMODB_TABLE` | DynamoDB table name            | `openmed-medications`         |

### DynamoDB Table Schema

The DynamoDB table uses a simple schema:

```json
{
  "id": "MOH_12345",           // Partition key (String)
  "name": "Medication Name",   // Medication name
  "status": "active",          // Status
  "category": "Antibiotics",   // Category
  "manufacturer": {            // Manufacturer object
    "name": "Teva",
    "country": "IL"
  },
  "composition": [...],        // Composition array
  "pricing": {...},            // Pricing object
  "meta": {                    // Metadata
    "version": "1.0",
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
  // ... other fields from your schema
}
```

## 📊 Monitoring

### CloudWatch Logs

Monitor the sync process:

```bash
# View recent logs
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/openmed-dynamodb-github-sync" \
  --order-by LastEventTime \
  --descending \
  --max-items 5

# Follow logs in real-time
aws logs tail /aws/lambda/openmed-dynamodb-github-sync --follow
```

### DynamoDB Metrics

Monitor DynamoDB performance:

```bash
# Check table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=openmed-medications \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## 🔄 How It Works

### 1. User Saves Medication

```
User clicks "Save" → App updates DynamoDB → DynamoDB Stream triggers Lambda
```

### 2. Lambda Processes Change

```
Lambda receives stream event → Converts DynamoDB format → Commits to GitHub
```

### 3. GitHub Gets Updated

```
GitHub receives commit → File updated in catalog/ → Full audit trail maintained
```

### 4. App Stays Fast

```
App reads from DynamoDB → Instant response → No waiting for GitHub
```

## 🚨 Troubleshooting

### Common Issues

1. **Lambda not triggering**

   - Check DynamoDB Streams are enabled
   - Verify Lambda permissions
   - Check CloudWatch logs

2. **GitHub API errors**

   - Verify GitHub token has correct permissions
   - Check rate limits (5,000 requests/hour)
   - Ensure repository exists and is accessible

3. **DynamoDB errors**
   - Check table exists and is accessible
   - Verify IAM permissions
   - Check for throttling

### Debug Commands

```bash
# Check Lambda function status
aws lambda get-function --function-name openmed-dynamodb-github-sync

# Test Lambda function
aws lambda invoke \
  --function-name openmed-dynamodb-github-sync \
  --payload '{"action":"full_sync"}' \
  response.json

# Check DynamoDB table
aws dynamodb describe-table --table-name openmed-medications

# List recent commits in GitHub
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$GITHUB_REPO/commits?per_page=5"
```

## 💰 Cost Estimation

### Monthly Costs (estimated)

| Service        | Usage               | Cost             |
| -------------- | ------------------- | ---------------- |
| **DynamoDB**   | 10,000 reads/writes | ~$5-15           |
| **Lambda**     | 1,000 invocations   | ~$0.20           |
| **CloudWatch** | Logs and metrics    | ~$1-3            |
| **Total**      |                     | **~$6-18/month** |

_Costs vary based on actual usage. DynamoDB uses pay-per-request pricing._

## 🔄 Migration from Files

To migrate your existing JSON files to DynamoDB:

1. **Export current data**:

   ```bash
   python scripts/export-to-dynamodb.py
   ```

2. **Update your app** to use DynamoDB instead of files

3. **Test the sync** by making changes

4. **Monitor** the sync process

## 🎯 Next Steps

1. **Update your Next.js app** to use DynamoDB
2. **Test the sync** with real data
3. **Monitor performance** and costs
4. **Set up alerts** for sync failures
5. **Deploy to production**

## 📞 Support

If you encounter issues:

1. Check CloudWatch logs first
2. Verify all environment variables are set
3. Test with the provided test script
4. Check AWS service quotas and limits

---

**This setup gives you the best of both worlds: fast access and complete audit trail!** 🚀
