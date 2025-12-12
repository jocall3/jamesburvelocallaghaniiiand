import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { KeyPair, KeyPairType } from '../../domain/model/KeyPair';
import { IKeyRepository } from '../../domain/ports/IKeyRepository';
import { EncryptionService } from './EncryptionService';
import { HashingService } from './HashingService';
import { Logger } from '@nestjs/common';

@Injectable()
export class KeyManagementService {
  private readonly logger = new Logger(KeyManagementService.name);

  constructor(
    @Inject('IKeyRepository') private readonly keyRepository: IKeyRepository,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly hashingService: HashingService,
  ) {}

  async generateKeyPair(
    userId: string,
    keyPairType: KeyPairType,
    description?: string,
  ): Promise<KeyPair> {
    this.logger.log(`Generating key pair of type ${keyPairType} for user ${userId}`);

    const privateKey = uuidv4(); // In reality, generate a cryptographically secure key
    const publicKey = this.hashingService.hash(privateKey); // In reality, derive public key from private key

    const encryptedPrivateKey = await this.encryptionService.encrypt(privateKey);

    const keyPair: KeyPair = {
      id: uuidv4(),
      userId,
      publicKey,
      encryptedPrivateKey,
      keyPairType,
      createdAt: new Date(),
      description: description || `Key pair generated on ${new Date().toISOString()}`,
    };

    await this.keyRepository.create(keyPair);
    this.logger.log(`Key pair created with ID: ${keyPair.id}`);
    return keyPair;
  }

  async getKeyPair(id: string): Promise<KeyPair | null> {
    this.logger.log(`Retrieving key pair with ID: ${id}`);
    return this.keyRepository.findById(id);
  }

  async getKeyPairsByUserId(userId: string): Promise<KeyPair[]> {
    this.logger.log(`Retrieving key pairs for user ID: ${userId}`);
    return this.keyRepository.findByUserId(userId);
  }

  async decryptPrivateKey(keyPairId: string): Promise<string | null> {
    this.logger.log(`Decrypting private key for key pair ID: ${keyPairId}`);
    const keyPair = await this.keyRepository.findById(keyPairId);

    if (!keyPair) {
      this.logger.warn(`Key pair with ID ${keyPairId} not found.`);
      return null;
    }

    try {
      const decryptedPrivateKey = await this.encryptionService.decrypt(
        keyPair.encryptedPrivateKey,
      );
      return decryptedPrivateKey;
    } catch (error) {
      this.logger.error(`Failed to decrypt private key for key pair ID ${keyPairId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async rotateEncryptionKey(): Promise<void> {
    this.logger.log('Rotating encryption key...');
    // 1. Generate a new encryption key
    const newEncryptionKey = uuidv4(); // Replace with secure key generation

    // 2. Fetch all key pairs
    const allKeyPairs = await this.keyRepository.findAll();

    // 3. Re-encrypt all private keys with the new key
    for (const keyPair of allKeyPairs) {
      try {
        const decryptedPrivateKey = await this.encryptionService.decrypt(
          keyPair.encryptedPrivateKey,
        );
        const newEncryptedPrivateKey = await this.encryptionService.encryptWithNewKey(
          decryptedPrivateKey,
          newEncryptionKey,
        );

        // 4. Update the key pair in the database
        keyPair.encryptedPrivateKey = newEncryptedPrivateKey;
        await this.keyRepository.update(keyPair);
      } catch (error) {
        this.logger.error(`Failed to re-encrypt key pair ID ${keyPair.id}: ${error.message}`, error.stack);
        // Consider implementing a retry mechanism or alerting system
      }
    }

    // 5. Update the encryption key in the configuration
    this.configService.set('ENCRYPTION_KEY', newEncryptionKey); // This might not persist the config depending on the ConfigModule setup.  Consider a more robust config management solution.

    this.logger.log('Encryption key rotation completed.');
  }

  async deleteKeyPair(id: string): Promise<void> {
    this.logger.log(`Deleting key pair with ID: ${id}`);
    await this.keyRepository.delete(id);
  }

  // Additional methods for key management can be added here, such as:
  // - Key revocation
  // - Key backup and recovery
  // - Multi-signature key management
}