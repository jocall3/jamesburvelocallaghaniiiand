import { WorkforcePlanningAPI } from './workforcePlanningAPI';

/**
 * Workforce Planning Client
 *
 * This class provides a client for interacting with Workforce Planning Software and Organizational Structure Generation tools.
 */
export class WorkforcePlanningClient {

  private workforcePlanningAPI: WorkforcePlanningAPI;

  /**
   * Creates a new WorkforcePlanningClient instance.
   * @param api The WorkforcePlanningAPI instance to use.
   */
  constructor(api: WorkforcePlanningAPI) {
    this.workforcePlanningAPI = api;
  }

  /**
   * Retrieves workforce plan data.
   * @param criteria The criteria for filtering the workforce plan data.
   * @returns The workforce plan data.
   * @throws An error if the API request fails.
   */
  async getWorkforcePlan(criteria: any): Promise<any> {
    try {
      const response = await this.workforcePlanningAPI.getWorkforcePlan(criteria);
      return response;
    } catch (error) {
      console.error('Error retrieving workforce plan:', error);
      throw error;
    }
  }

  /**
   * Generates an organizational structure.
   * @param criteria The criteria for generating the organizational structure.
   * @returns The organizational structure.
   * @throws An error if the API request fails.
   */
  async generateOrganizationStructure(criteria: any): Promise<any> {
    try {
      const response = await this.workforcePlanningAPI.generateOrganizationStructure(criteria);
      return response;
    } catch (error) {
      console.error('Error generating organization structure:', error);
      throw error;
    }
  }

  /**
   * Updates workforce plan data.
   * @param data The data to update.
   * @returns The updated workforce plan data.
   * @throws An error if the API request fails.
   */
  async updateWorkforcePlan(data: any): Promise<any> {
    try {
      const response = await this.workforcePlanningAPI.updateWorkforcePlan(data);
      return response;
    } catch (error) {
      console.error('Error updating workforce plan:', error);
      throw error;
    }
  }

  /**
   * Deletes workforce plan data.
   * @param id The ID of the workforce plan data to delete.
   * @returns A confirmation message.
   * @throws An error if the API request fails.
   */
  async deleteWorkforcePlan(id: any): Promise<any> {
    try {
      const response = await this.workforcePlanningAPI.deleteWorkforcePlan(id);
      return response;
    } catch (error) {
      console.error('Error deleting workforce plan:', error);
      throw error;
    }
  }

  /**
   * Creates a new workforce plan.
   * @param data The data for the new workforce plan.
   * @returns The newly created workforce plan data.
   * @throws An error if the API request fails.
   */
  async createWorkforcePlan(data: any): Promise<any> {
    try {
      const response = await this.workforcePlanningAPI.createWorkforcePlan(data);
      return response;
    } catch (error) {
      console.error('Error creating workforce plan:', error);
      throw error;
    }
  }
}