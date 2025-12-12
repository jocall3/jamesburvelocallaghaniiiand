import { Pool } from 'pg';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DataWarehouseConnector {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      host: this.configService.get<string>('DATA_WAREHOUSE_HOST'),
      port: this.configService.get<number>('DATA_WAREHOUSE_PORT'),
      user: this.configService.get<string>('DATA_WAREHOUSE_USER'),
      password: this.configService.get<string>('DATA_WAREHOUSE_PASSWORD'),
      database: this.configService.get<string>('DATA_WAREHOUSE_DATABASE'),
      max: this.configService.get<number>('DATA_WAREHOUSE_MAX_CONNECTIONS', 20),
      idleTimeoutMillis: this.configService.get<number>('DATA_WAREHOUSE_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: this.configService.get<number>('DATA_WAREHOUSE_CONNECTION_TIMEOUT', 5000),
    });

    this.pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query<T>(queryText: string, values?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(queryText, values);
      return result.rows as T[];
    } catch (error) {
      console.error('Error executing query:', queryText, values, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async execute(queryText: string, values?: any[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(queryText, values);
    } catch (error) {
      console.error('Error executing query:', queryText, values, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  async releaseClient(client: any) {
    client.release();
  }

  async startTransaction() {
    const client = await this.getClient();
    await client.query('BEGIN');
    return client;
  }

  async commitTransaction(client: any) {
    await client.query('COMMIT');
    await this.releaseClient(client);
  }

  async rollbackTransaction(client: any) {
    await client.query('ROLLBACK');
    await this.releaseClient(client);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Data warehouse health check failed:', error);
      return false;
    }
  }
}