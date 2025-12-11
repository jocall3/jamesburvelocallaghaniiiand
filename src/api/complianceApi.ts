```typescript
import axios, { AxiosResponse } from 'axios';

const BASE_URL = '/api/compliance'; // Assuming a base URL for the API

export interface CompliancePolicy {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType?: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

export const getAllCompliancePolicies = async (): Promise<CompliancePolicy[]> => {
  try {
    const response: AxiosResponse<CompliancePolicy[]> = await axios.get(`${BASE_URL}/policies`);
    return response.data;
  } catch (error) {
    console.error("Error fetching compliance policies:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

export const getCompliancePolicy = async (policyId: string): Promise<CompliancePolicy> => {
  try {
    const response: AxiosResponse<CompliancePolicy> = await axios.get(`${BASE_URL}/policies/${policyId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching compliance policy with ID ${policyId}:`, error);
    throw error;
  }
};

// Example: Update a compliance policy (PUT request) - Implement appropriately based on your API
export const updateCompliancePolicy = async (policyId: string, policy: CompliancePolicy): Promise<CompliancePolicy> => {
  try {
    const response: AxiosResponse<CompliancePolicy> = await axios.put(`${BASE_URL}/policies/${policyId}`, policy);
    return response.data;
  } catch (error) {
    console.error(`Error updating compliance policy with ID ${policyId}:`, error);
    throw error;
  }
};

// Example: Create a compliance policy (POST request) -  Implement appropriately based on your API
export const createCompliancePolicy = async (policy: CompliancePolicy): Promise<CompliancePolicy> => {
    try {
        const response: AxiosResponse<CompliancePolicy> = await axios.post(`${BASE_URL}/policies`, policy);
        return response.data;
    } catch (error) {
        console.error("Error creating compliance policy:", error);
        throw error;
    }
}


//Example: Delete a compliance policy
export const deleteCompliancePolicy = async (policyId: string): Promise<void> => {
  try {
    await axios.delete(`${BASE_URL}/policies/${policyId}`);
  } catch (error) {
    console.error(`Error deleting compliance policy with ID ${policyId}:`, error);
    throw error;
  }
}
```