#!/usr/bin/env python3
"""
DynamoDB to GitHub Sync Lambda Function
Syncs DynamoDB changes to GitHub repository for audit trail
"""

import json
import os
import boto3
import requests
from datetime import datetime
from typing import Dict, Any, List

# GitHub configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPO', 'FormidableCare/OpenMed-Data')
GITHUB_BRANCH = os.environ.get('GITHUB_BRANCH', 'main')
GITHUB_USER = os.environ.get('GITHUB_USER', 'OpenMed')
GITHUB_EMAIL = os.environ.get('GITHUB_EMAIL', 'system@openmed.formidable.care')

# DynamoDB configuration
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'openmed-medications')

class DynamoDBGitHubSync:
    """Syncs DynamoDB changes to GitHub repository"""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(DYNAMODB_TABLE)
        self.github_headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
    
    def get_github_file_sha(self, file_path: str) -> str:
        """Get the SHA of an existing file in GitHub"""
        try:
            url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}'
            response = requests.get(url, headers=self.github_headers)
            if response.status_code == 200:
                return response.json()['sha']
            return None
        except Exception as e:
            print(f"Error getting file SHA: {e}")
            return None
    
    def commit_to_github(self, file_path: str, content: str, message: str) -> bool:
        """Commit a file to GitHub"""
        try:
            # Get existing file SHA if it exists
            sha = self.get_github_file_sha(file_path)
            
            # Prepare commit data
            commit_data = {
                'message': message,
                'content': content,
                'branch': GITHUB_BRANCH
            }
            
            if sha:
                commit_data['sha'] = sha
            
            # Make API request
            url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}'
            response = requests.put(url, headers=self.github_headers, json=commit_data)
            
            if response.status_code in [200, 201]:
                print(f"Successfully committed {file_path} to GitHub")
                return True
            else:
                print(f"Failed to commit {file_path}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error committing to GitHub: {e}")
            return False
    
    def process_dynamodb_record(self, record: Dict[str, Any]) -> bool:
        """Process a single DynamoDB stream record"""
        try:
            event_name = record['eventName']
            dynamodb_data = record['dynamodb']
            
            if event_name == 'INSERT' or event_name == 'MODIFY':
                # Get the new image (current data)
                new_image = dynamodb_data.get('NewImage', {})
                medication_id = new_image.get('id', {}).get('S')
                
                if not medication_id:
                    print("No medication ID found in record")
                    return False
                
                # Convert DynamoDB format to JSON
                medication_data = self.convert_dynamodb_to_json(new_image)
                
                # Create commit message
                timestamp = datetime.now().isoformat()
                message = f"Update medication {medication_id} via DynamoDB - {timestamp}"
                
                # Commit to GitHub
                file_path = f"catalog/{medication_id}.json"
                content = json.dumps(medication_data, indent=2, ensure_ascii=False)
                
                return self.commit_to_github(file_path, content, message)
                
            elif event_name == 'REMOVE':
                # Handle medication deletion
                old_image = dynamodb_data.get('OldImage', {})
                medication_id = old_image.get('id', {}).get('S')
                
                if medication_id:
                    message = f"Delete medication {medication_id} via DynamoDB - {datetime.now().isoformat()}"
                    # Note: GitHub doesn't support file deletion via this API easily
                    # You might want to create a deletion marker file instead
                    print(f"Medication {medication_id} deleted (not syncing deletion to GitHub)")
                
            return True
            
        except Exception as e:
            print(f"Error processing DynamoDB record: {e}")
            return False
    
    def convert_dynamodb_to_json(self, dynamodb_item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DynamoDB item format to regular JSON"""
        result = {}
        
        for key, value_dict in dynamodb_item.items():
            value_type = list(value_dict.keys())[0]
            value = value_dict[value_type]
            
            if value_type == 'S':  # String
                result[key] = value
            elif value_type == 'N':  # Number
                result[key] = float(value) if '.' in value else int(value)
            elif value_type == 'BOOL':  # Boolean
                result[key] = value
            elif value_type == 'NULL':  # Null
                result[key] = None
            elif value_type == 'L':  # List
                result[key] = [self.convert_dynamodb_to_json(item) if isinstance(item, dict) else item for item in value]
            elif value_type == 'M':  # Map
                result[key] = self.convert_dynamodb_to_json(value)
            elif value_type == 'SS':  # String Set
                result[key] = list(value)
            elif value_type == 'NS':  # Number Set
                result[key] = [float(v) if '.' in v else int(v) for v in value]
        
        return result
    
    def sync_all_to_github(self) -> bool:
        """Sync all DynamoDB data to GitHub (for initial setup or recovery)"""
        try:
            print("Starting full sync to GitHub...")
            
            # Scan all items from DynamoDB
            response = self.table.scan()
            items = response['Items']
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            print(f"Found {len(items)} items to sync")
            
            success_count = 0
            for item in items:
                medication_id = item.get('id')
                if medication_id:
                    file_path = f"catalog/{medication_id}.json"
                    content = json.dumps(item, indent=2, ensure_ascii=False)
                    message = f"Sync medication {medication_id} from DynamoDB - {datetime.now().isoformat()}"
                    
                    if self.commit_to_github(file_path, content, message):
                        success_count += 1
            
            print(f"Successfully synced {success_count}/{len(items)} items to GitHub")
            return success_count == len(items)
            
        except Exception as e:
            print(f"Error in full sync: {e}")
            return False

def lambda_handler(event, context):
    """AWS Lambda handler function"""
    try:
        sync = DynamoDBGitHubSync()
        
        # Check if this is a DynamoDB stream event
        if 'Records' in event:
            # Process DynamoDB stream records
            success_count = 0
            for record in event['Records']:
                if sync.process_dynamodb_record(record):
                    success_count += 1
            
            print(f"Processed {success_count}/{len(event['Records'])} records successfully")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Processed {success_count} records')
            }
        
        # If no Records, this might be a manual trigger for full sync
        elif 'action' in event and event['action'] == 'full_sync':
            success = sync.sync_all_to_github()
            return {
                'statusCode': 200 if success else 500,
                'body': json.dumps('Full sync completed' if success else 'Full sync failed')
            }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps('Invalid event format')
            }
            
    except Exception as e:
        print(f"Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

if __name__ == "__main__":
    # For local testing
    sync = DynamoDBGitHubSync()
    sync.sync_all_to_github() 