import { Request, Response } from 'express';
import { ConnectionService } from '../services/connectionService';
import { OpenBankingConnector } from '../../../connector';
import { IConnection } from '../models/connection';

export class ConnectionController {
  private connectionService: ConnectionService;
  private openBankingConnector: OpenBankingConnector;

  constructor(connectionService: ConnectionService, openBankingConnector: OpenBankingConnector) {
    this.connectionService = connectionService;
    this.openBankingConnector = openBankingConnector;
  }

  public async getAllConnections(req: Request, res: Response): Promise<void> {
    try {
      const connections = await this.connectionService.getAllConnections();
      res.status(200).json(connections);
    } catch (error: any) {
      console.error('Error fetching all connections:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  public async getConnectionById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const connection = await this.connectionService.getConnectionById(id);

      if (!connection) {
        res.status(404).json({ message: 'Connection not found' });
        return;
      }

      res.status(200).json(connection);
    } catch (error: any) {
      console.error('Error fetching connection by ID:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  public async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const connectionData: IConnection = req.body;
      const newConnection = await this.connectionService.createConnection(connectionData);
      res.status(201).json(newConnection);
    } catch (error: any) {
      console.error('Error creating connection:', error);
      res.status(400).json({ error: error.message || 'Bad Request' });
    }
  }

  public async updateConnection(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const connectionData: IConnection = req.body;
      const updatedConnection = await this.connectionService.updateConnection(id, connectionData);

      if (!updatedConnection) {
        res.status(404).json({ message: 'Connection not found' });
        return;
      }

      res.status(200).json(updatedConnection);
    } catch (error: any) {
      console.error('Error updating connection:', error);
      res.status(400).json({ error: error.message || 'Bad Request' });
    }
  }

  public async deleteConnection(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const deleted = await this.connectionService.deleteConnection(id);

      if (!deleted) {
        res.status(404).json({ message: 'Connection not found' });
        return;
      }

      res.status(204).send(); // No content
    } catch (error: any) {
      console.error('Error deleting connection:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  public async initiateAuthorization(req: Request, res: Response): Promise<void> {
    try {
      const institutionId = req.body.institutionId; // Assuming institutionId is passed in the request body
      const redirectUri = req.body.redirectUri; // Assuming redirectUri is passed in the request body

      if (!institutionId || !redirectUri) {
        res.status(400).json({ error: 'Institution ID and Redirect URI are required.' });
        return;
      }

      const authorizationUrl = await this.openBankingConnector.getAuthorizationUrl(institutionId, redirectUri);

      res.status(200).json({ authorizationUrl });
    } catch (error: any) {
      console.error('Error initiating authorization:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  public async handleAuthorizationCallback(req: Request, res: Response): Promise<void> {
    try {
      const authorizationCode = req.query.code as string;
      const institutionId = req.query.institution_id as string;
      const redirectUri = req.query.redirect_uri as string;

      if (!authorizationCode || !institutionId || !redirectUri) {
        res.status(400).json({ error: 'Authorization code, Institution ID, and Redirect URI are required.' });
        return;
      }

      const accessTokenResponse = await this.openBankingConnector.exchangeCodeForToken(authorizationCode, institutionId, redirectUri);

      // Store the access token and other relevant information securely.
      // Associate the token with a user or connection in your database.
      // You might also want to store the refresh token for future use.

      // Example:
      const connectionData: IConnection = {
        institutionId: institutionId,
        accessToken: accessTokenResponse.access_token,
        refreshToken: accessTokenResponse.refresh_token,
        expiresAt: new Date(Date.now() + accessTokenResponse.expires_in * 1000), // Convert seconds to milliseconds
        userId: 'someUserId', // Replace with the actual user ID
        status: 'active',
        connectionName: `Connection to ${institutionId}` // Example connection name
      };

      const newConnection = await this.connectionService.createConnection(connectionData);

      res.status(200).json({ message: 'Authorization successful', connectionId: newConnection.id });
    } catch (error: any) {
      console.error('Error handling authorization callback:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  public async refreshAccessToken(req: Request, res: Response): Promise<void> {
    try {
      const connectionId = req.params.id;
      const connection = await this.connectionService.getConnectionById(connectionId);

      if (!connection) {
        res.status(404).json({ message: 'Connection not found' });
        return;
      }

      if (!connection.refreshToken) {
        res.status(400).json({ message: 'Refresh token not found for this connection.' });
        return;
      }

      const institutionId = connection.institutionId; // Assuming institutionId is stored in the connection object
      const refreshToken = connection.refreshToken;

      const accessTokenResponse = await this.openBankingConnector.refreshAccessToken(refreshToken, institutionId);

      // Update the connection with the new access token and refresh token (if provided).
      connection.accessToken = accessTokenResponse.access_token;
      connection.expiresAt = new Date(Date.now() + accessTokenResponse.expires_in * 1000);
      if (accessTokenResponse.refresh_token) {
        connection.refreshToken = accessTokenResponse.refresh_token;
      }

      await this.connectionService.updateConnection(connectionId, connection);

      res.status(200).json({ message: 'Access token refreshed successfully', accessToken: accessTokenResponse.access_token });
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
}