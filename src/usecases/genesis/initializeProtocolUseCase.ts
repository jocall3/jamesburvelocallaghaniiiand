import { ProtocolRepository } from '../../domain/repositories/protocolRepository';
import { GenesisRepository } from '../../domain/repositories/genesisRepository';
import { Protocol } from '../../domain/entities/protocol';
import { Genesis } from '../../domain/entities/genesis';
import { Logger } from '../../utils/logger';

export class InitializeProtocolUseCase {
  constructor(
    private readonly protocolRepository: ProtocolRepository,
    private readonly genesisRepository: GenesisRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Executes the 'Initialize Protocol' use case.
   * This use case is responsible for setting up the foundational Genesis layer of the protocol.
   * It ensures that the protocol is initialized only once.
   *
   * @returns {Promise<void>} A promise that resolves when the protocol initialization is complete.
   * @throws {Error} If the protocol has already been initialized.
   */
  async execute(): Promise<void> {
    this.logger.info('Starting Initialize Protocol Use Case...');

    const existingProtocol = await this.protocolRepository.getProtocol();

    if (existingProtocol) {
      this.logger.warn('Protocol has already been initialized. Skipping initialization.');
      throw new Error('Protocol has already been initialized.');
    }

    // Create the initial Genesis block
    const initialGenesis = new Genesis({
      blockNumber: 0,
      timestamp: Date.now(),
      previousHash: '0'.repeat(64), // Genesis block has no previous hash
      data: {
        message: 'Genesis block of the protocol.',
      },
      hash: 'genesis_hash_placeholder', // This will be calculated later or set by a specific genesis generation logic
    });

    // Save the Genesis block
    await this.genesisRepository.saveGenesisBlock(initialGenesis);
    this.logger.info(`Genesis block created with number: ${initialGenesis.blockNumber}`);

    // Create and save the initial Protocol entity
    const newProtocol = new Protocol({
      isInitialized: true,
      genesisBlockNumber: initialGenesis.blockNumber,
      currentBlockNumber: initialGenesis.blockNumber,
      createdAt: new Date(),
    });

    await this.protocolRepository.saveProtocol(newProtocol);
    this.logger.info('Protocol initialized successfully.');
  }
}