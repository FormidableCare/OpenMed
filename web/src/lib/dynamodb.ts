import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { OpenMedMedication } from '@/types/medication';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'openmed-medications';

export interface DynamoDBConfig {
  tableName: string;
  region: string;
}

export class OpenMedDynamoDBService {
  private tableName: string;
  private client: DynamoDBDocumentClient;

  constructor(config?: Partial<DynamoDBConfig>) {
    this.tableName = config?.tableName || TABLE_NAME;
    this.client = docClient;
  }

  /**
   * Get a single medication by ID
   */
  async getMedication(id: string): Promise<OpenMedMedication | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const response = await this.client.send(command);
      return response.Item as OpenMedMedication || null;
    } catch (error) {
      console.error('Error getting medication:', error);
      throw new Error(`Failed to get medication ${id}`);
    }
  }

  /**
   * Get all medications with optional filtering
   */
  async getAllMedications(limit?: number): Promise<OpenMedMedication[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      });

      const response = await this.client.send(command);
      return (response.Items || []) as OpenMedMedication[];
    } catch (error) {
      console.error('Error getting all medications:', error);
      throw new Error('Failed to get medications');
    }
  }

  /**
   * Query medications by status
   */
  async getMedicationsByStatus(status: string, limit?: number): Promise<OpenMedMedication[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
        Limit: limit,
      });

      const response = await this.client.send(command);
      return (response.Items || []) as OpenMedMedication[];
    } catch (error) {
      console.error('Error querying medications by status:', error);
      throw new Error(`Failed to get medications with status ${status}`);
    }
  }

  /**
   * Query medications by category
   */
  async getMedicationsByCategory(category: string, limit?: number): Promise<OpenMedMedication[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'category-index',
        KeyConditionExpression: '#category = :category',
        ExpressionAttributeNames: {
          '#category': 'category',
        },
        ExpressionAttributeValues: {
          ':category': category,
        },
        Limit: limit,
      });

      const response = await this.client.send(command);
      return (response.Items || []) as OpenMedMedication[];
    } catch (error) {
      console.error('Error querying medications by category:', error);
      throw new Error(`Failed to get medications with category ${category}`);
    }
  }

  /**
   * Query medications by manufacturer
   */
  async getMedicationsByManufacturer(manufacturerName: string, limit?: number): Promise<OpenMedMedication[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'manufacturer-index',
        KeyConditionExpression: '#manufacturer_name = :manufacturer_name',
        ExpressionAttributeNames: {
          '#manufacturer_name': 'manufacturer_name',
        },
        ExpressionAttributeValues: {
          ':manufacturer_name': manufacturerName,
        },
        Limit: limit,
      });

      const response = await this.client.send(command);
      return (response.Items || []) as OpenMedMedication[];
    } catch (error) {
      console.error('Error querying medications by manufacturer:', error);
      throw new Error(`Failed to get medications from manufacturer ${manufacturerName}`);
    }
  }

  /**
   * Search medications by name (case-insensitive)
   */
  async searchMedicationsByName(searchTerm: string, limit?: number): Promise<OpenMedMedication[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'contains(#name, :searchTerm)',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':searchTerm': searchTerm.toLowerCase(),
        },
        Limit: limit,
      });

      const response = await this.client.send(command);
      return (response.Items || []) as OpenMedMedication[];
    } catch (error) {
      console.error('Error searching medications by name:', error);
      throw new Error(`Failed to search medications with term ${searchTerm}`);
    }
  }

  /**
   * Create or update a medication
   */
  async putMedication(medication: OpenMedMedication): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: medication,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error putting medication:', error);
      throw new Error(`Failed to save medication ${medication.id}`);
    }
  }

  /**
   * Delete a medication
   */
  async deleteMedication(id: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw new Error(`Failed to delete medication ${id}`);
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<{ itemCount: number; tableName: string }> {
    try {
      // Note: This is a simplified version. In production, you might want to use CloudWatch metrics
      const medications = await this.getAllMedications();
      return {
        itemCount: medications.length,
        tableName: this.tableName,
      };
    } catch (error) {
      console.error('Error getting table stats:', error);
      throw new Error('Failed to get table statistics');
    }
  }

  /**
   * Export all medications as FHIR resources
   */
  async exportAllAsFHIR(): Promise<OpenMedMedication[]> {
    try {
      const medications = await this.getAllMedications();
      return medications.map(medication => this.convertToFHIR(medication));
    } catch (error) {
      console.error('Error exporting medications as FHIR:', error);
      throw new Error('Failed to export medications as FHIR');
    }
  }

  /**
   * Convert OpenMed medication to FHIR format
   */
  private convertToFHIR(medication: OpenMedMedication): OpenMedMedication {
    // Ensure the medication has the proper FHIR resource type
    return {
      ...medication,
      resourceType: 'OpenMedMedication',
      meta: {
        ...medication.meta,
        lastUpdated: medication.meta?.lastUpdated || new Date().toISOString(),
      },
    };
  }
}

// Export singleton instance
export const dynamoDBService = new OpenMedDynamoDBService(); 