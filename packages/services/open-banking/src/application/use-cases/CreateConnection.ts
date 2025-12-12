import { inject, injectable } from 'tsyringe';
import { IConnectionsRepository } from '../../domain/repositories/IConnectionsRepository';
import { Connection } from '../../domain/entities/Connection';
import { IBankService } from '../services/IBankService';
import { AppError } from '@shared/errors/AppError';

interface ICreateConnectionDTO {
  userId: string;
  bankId: string;
  // Add any other necessary data for establishing a connection
}

@injectable()
export class CreateConnection {
  constructor(
    @inject('ConnectionsRepository')
    private connectionsRepository: IConnectionsRepository,
    @inject('BankService')
    private bankService: IBankService,
  ) {}

  async execute({ userId, bankId }: ICreateConnectionDTO): Promise<Connection> {
    // 1. Validate if the bank exists and is supported
    const bank = await this.bankService.getBankById(bankId);

    if (!bank) {
      throw new AppError('Bank not found', 404);
    }

    if (!bank.isSupported) {
      throw new AppError('Bank is not supported', 400);
    }

    // 2. Check if a connection already exists for this user and bank
    const existingConnection = await this.connectionsRepository.findByUserIdAndBankId(userId, bankId);

    if (existingConnection) {
      throw new AppError('Connection already exists for this user and bank', 400);
    }

    // 3. Initiate the connection with the bank's API (e.g., using OAuth flow)
    //    This part will depend on the specific bank's API and authentication method.
    //    For now, we'll simulate the initiation and assume it returns a connection token.
    const connectionToken = await this.bankService.initiateConnection(userId, bankId);

    if (!connectionToken) {
      throw new AppError('Failed to initiate connection with the bank', 500);
    }

    // 4. Create a new Connection entity
    const connection = new Connection({
      userId,
      bankId,
      connectionToken,
      status: 'pending', // Initial status
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Save the connection to the database
    await this.connectionsRepository.create(connection);

    return connection;
  }
}