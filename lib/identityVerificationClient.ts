import { OnfidoClient } from './OnfidoClient';

export class APIClient {
  constructor(onfidoClient: OnfidoClient) {
    this.onfidoClient = onfidoClient;
  }

  async verifyCustomer(customerID: string): Promise<boolean> {
    try {
      const response = await this.onfidoClient.verifyCustomer(customerID);
      return response.status === 200;
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  }
}