import { SecurityEventManagementClient } from './siemClient';

export class SecurityEventManagementClient {
  constructor(private client: SecurityEventManagementClient) {}

  async getEventLogs(eventName: string): Promise<any> {
    try {
      const response = await client.getEventLogs(eventName);
      return response.data;
    } catch (error) {
      console.error(`Error retrieving event logs for ${eventName}:`, error);
      throw error;
    }
  }

  async createEventLog(eventName: string, data: any): Promise<any> {
    try {
      const response = await client.createEventLog(eventName, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating event log for ${eventName}:`, error);
      throw error;
    }
  }

  async executeEventLog(eventName: string, data: any): Promise<any> {
    try {
      const response = await client.executeEventLog(eventName, data);
      return response.data;
    } catch (error) {
      console.error(`Error executing event log for ${eventName}:`, error);
      throw error;
    }
  }
}