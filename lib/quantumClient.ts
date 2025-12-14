import { QuantumSimulationClient } from './quantum-simulation-client';

export class QuantumClient {
  async initialize(): Promise<void> {
    try {
      const client = new QuantumSimulationClient();
      console.log('Quantum Simulation Client initialized successfully.');
    } catch (error) {
      console.error('Error initializing Quantum Simulation Client:', error);
    }
  }

  async executeQuery(query: string): Promise<string> {
    try {
      const response = await client.executeQuery(query);
      console.log(`Quantum Simulation Response for query: ${query}`);
      return response;
    } catch (error) {
      console.error('Error executing Quantum Simulation Query:', error);
      throw error;
    }
  }
}