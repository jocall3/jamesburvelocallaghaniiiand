import {
  KeyPair,
  PrivateKey,
  PublicKey,
  Signature,
  SigningAlgorithm,
} from "@cosmjs/crypto";
import {
  encodeSecp256k1Signature,
  Secp256k1,
} from "@cosmjs/amino-amino-encoding";
import {
  encodeBech32Address,
  fromBase64,
  toBase64,
} from "@cosmjs/encoding";
import {
  generateMnemonic,
  BIP39,
} from "@cosmjs/crypto";
import {
  DirectSecp256k1HdWallet,
  DirectSecp256k1Wallet,
} from "@cosmjs/proto-signing";
import {
  Account,
  AccountAddress,
  ChainId,
  GenesisState,
  Module,
  ModuleId,
  ProtocolVersion,
  Timestamp,
  Validator,
  ValidatorAddress,
  ValidatorConsensusKey,
  ValidatorConsensusKeyType,
  ValidatorDescription,
  ValidatorInfo,
  ValidatorStatus,
  ValidatorVotingPower,
} from "@genesis/core";
import {
  GenesisProtocolError,
  GenesisProtocolErrorType,
} from "@genesis/errors";
import {
  GenesisRepository,
  GenesisRepositoryError,
} from "@genesis/repositories";
import {
  Logger,
  LogLevel,
} from "@genesis/utils";

/**
 * Represents the business logic for establishing the cryptographic root of trust
 * within the Genesis protocol. This corresponds to T2_USE_CASE_2.
 */
export class EstablishRootOfTrustUseCase {
  private readonly logger: Logger;
  private readonly genesisRepository: GenesisRepository;

  constructor(genesisRepository: GenesisRepository, logger: Logger) {
    this.genesisRepository = genesisRepository;
    this.logger = logger.createLogger("EstablishRootOfTrustUseCase");
  }

  /**
   * Establishes the root of trust for the Genesis protocol. This involves:
   * 1. Generating a root validator's key pair.
   * 2. Creating the initial Genesis state with the root validator.
   * 3. Storing the Genesis state and the root validator's private key.
   *
   * @param chainId - The unique identifier for the blockchain.
   * @param protocolVersion - The version of the Genesis protocol.
   * @param rootValidatorDescription - A description for the root validator.
   * @param rootValidatorConsensusKey - The consensus public key for the root validator.
   * @returns A Promise that resolves with the Genesis state if successful, or rejects with an error.
   */
  public async establish(
    chainId: ChainId,
    protocolVersion: ProtocolVersion,
    rootValidatorDescription: ValidatorDescription,
    rootValidatorConsensusKey: ValidatorConsensusKey
  ): Promise < GenesisState > {
    this.logger.log(
      LogLevel.INFO,
      `Establishing root of trust for chainId: ${chainId}, protocolVersion: ${protocolVersion}`
    );

    // 1. Generate a root validator's key pair.
    const rootValidatorKeyPair = await this.generateRootValidatorKeyPair();
    const rootValidatorAddress = this.deriveValidatorAddress(
      rootValidatorKeyPair.pubKey,
      chainId
    );

    this.logger.log(
      LogLevel.DEBUG,
      `Generated root validator address: ${rootValidatorAddress}`
    );

    // Validate the provided consensus key matches the generated key pair's public key type.
    if (
      rootValidatorConsensusKey.type !== ValidatorConsensusKeyType.Secp256k1 ||
      !this.areKeysEqual(
        rootValidatorKeyPair.pubKey,
        fromBase64(rootValidatorConsensusKey.key)
      )
    ) {
      this.logger.error(
        `Provided consensus key does not match the generated root validator's public key.`
      );
      throw new GenesisProtocolError(
        GenesisProtocolErrorType.InvalidConsensusKey,
        `Provided consensus key does not match the generated root validator's public key.`
      );
    }

    // 2. Create the initial Genesis state with the root validator.
    const genesisState = this.createInitialGenesisState(
      chainId,
      protocolVersion,
      rootValidatorAddress,
      rootValidatorDescription,
      rootValidatorConsensusKey
    );

    // 3. Store the Genesis state and the root validator's private key.
    await this.storeGenesisState(genesisState);
    await this.storeRootValidatorPrivateKey(
      rootValidatorAddress,
      rootValidatorKeyPair.privKey
    );

    this.logger.log(
      LogLevel.INFO,
      `Root of trust established successfully for chainId: ${chainId}. Genesis state created.`
    );

    return genesisState;
  }

  /**
   * Generates a new Secp256k1 key pair for the root validator.
   * @returns A Promise that resolves with the KeyPair.
   */
  private async generateRootValidatorKeyPair(): Promise < KeyPair > {
    // Use a secure random mnemonic to generate the key pair.
    const mnemonic = await generateMnemonic(BIP39);
    this.logger.log(LogLevel.DEBUG, `Generated mnemonic for root validator.`);
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "genesis",
    }); // Assuming "genesis" is the bech32 prefix for validator addresses.
    const [account] = await wallet.getAccounts();
    const privateKey = await wallet.getPrivateKey(account.address);

    return {
      pubKey: account.pubkey,
      privKey: privateKey,
    };
  }

  /**
   * Derives the validator address from its public key and chain ID.
   * @param publicKey - The validator's public key.
   * @param chainId - The chain ID.
   * @returns The derived validator address.
   */
  private deriveValidatorAddress(
    publicKey: Uint8Array,
    chainId: ChainId
  ): ValidatorAddress {
    // In a real-world scenario, this would involve a more robust address derivation
    // mechanism, potentially including a specific prefix and hashing algorithm.
    // For simplicity, we'll use a basic encoding here.
    // The prefix "genesis" is assumed for validator addresses.
    const addressBytes = encodeBech32Address(
      publicKey,
      "genesis"
    ); // Assuming "genesis" is the bech32 prefix for validator addresses.
    return addressBytes as ValidatorAddress;
  }

  /**
   * Checks if two public keys are equal.
   * @param key1 - The first public key.
   * @param key2 - The second public key.
   * @returns True if the keys are equal, false otherwise.
   */
  private areKeysEqual(key1: Uint8Array, key2: Uint8Array): boolean {
    if (key1.length !== key2.length) {
      return false;
    }
    for (let i = 0; i < key1.length; i++) {
      if (key1[i] !== key2[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates the initial Genesis state for the blockchain.
   * @param chainId - The unique identifier for the blockchain.
   * @param protocolVersion - The version of the Genesis protocol.
   * @param rootValidatorAddress - The address of the root validator.
   * @param rootValidatorDescription - A description for the root validator.
   * @param rootValidatorConsensusKey - The consensus public key for the root validator.
   * @returns The initial Genesis state.
   */
  private createInitialGenesisState(
    chainId: ChainId,
    protocolVersion: ProtocolVersion,
    rootValidatorAddress: ValidatorAddress,
    rootValidatorDescription: ValidatorDescription,
    rootValidatorConsensusKey: ValidatorConsensusKey
  ): GenesisState {
    const now = Timestamp.now();

    const rootValidator: Validator = {
      address: rootValidatorAddress,
      description: rootValidatorDescription,
      consensusKey: rootValidatorConsensusKey,
      status: ValidatorStatus.Active,
      votingPower: ValidatorVotingPower.Max, // Root validator has maximum voting power initially.
      joinedAt: now,
      proposalsVotedOn: 0,
      proposalsCreated: 0,
      delegatedToMe: 0,
      delegatedByMe: 0,
      uptimePercentage: 100,
      commissionRate: 0,
      maxCommissionRate: 0,
      maxChangeRate: 0,
      lastCommissionUpdate: now,
      bondHeight: 0,
      unbondingHeight: 0,
      unbondingOnHoldUntil: Timestamp.fromSeconds(0),
    };

    const genesisState: GenesisState = {
      chainId,
      protocolVersion,
      timestamp: now,
      modules: {
        [ModuleId.Staking]: {
          id: ModuleId.Staking,
          version: "1.0.0", // Example version
          params: {
            // Staking module parameters
            bondDenom: "ugene",
            unbondingTime: 1000 * 60 * 60 * 24 * 7, // 7 days
            maxEntries: 7,
            // ... other staking params
          },
          state: {
            validators: [rootValidator],
            // ... other staking state
          },
        },
        [ModuleId.Auth]: {
          id: ModuleId.Auth,
          version: "1.0.0",
          params: {
            // Auth module parameters
            // ...
          },
          state: {
            // Auth module state
            accounts: [], // Initially no accounts other than validators
          },
        },
        // Add other essential modules here
      },
      consensusParams: {
        // Consensus parameters
        block: {
          maxBytes: 22020096,
          maxGas: -1,
          timePerBlock: 6000000000, // 6 seconds
        },
        evidence: {
          maxAgeNumBlocks: 100000,
          maxAgeDuration: 172800000000000, // 2 weeks
          maxBytes: 1048576,
        },
        validator: {
          pubKeyTypes: [ValidatorConsensusKeyType.Secp256k1],
        },
        // ... other consensus params
      },
    };

    this.logger.log(
      LogLevel.DEBUG,
      `Created initial Genesis state with root validator: ${rootValidatorAddress}`
    );
    return genesisState;
  }

  /**
   * Stores the Genesis state in the repository.
   * @param genesisState - The Genesis state to store.
   * @throws GenesisRepositoryError if storage fails.
   */
  private async storeGenesisState(genesisState: GenesisState): Promise < void > {
    try {
      await this.genesisRepository.saveGenesisState(genesisState);
      this.logger.log(
        LogLevel.INFO,
        `Genesis state saved successfully for chainId: ${genesisState.chainId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save Genesis state for chainId: ${genesisState.chainId}`,
        error
      );
      throw new GenesisProtocolError(
        GenesisProtocolErrorType.RepositoryError,
        `Failed to save Genesis state: ${error.message}`
      );
    }
  }

  /**
   * Stores the root validator's private key securely.
   * In a production environment, this would involve a secure key management system.
   * For this example, we'll store it in the repository, but this is NOT recommended for production.
   * @param validatorAddress - The address of the root validator.
   * @param privateKey - The private key of the root validator.
   * @throws GenesisRepositoryError if storage fails.
   */
  private async storeRootValidatorPrivateKey(
    validatorAddress: ValidatorAddress,
    privateKey: PrivateKey
  ): Promise < void > {
    try {
      // WARNING: Storing private keys directly in a database is highly insecure.
      // This is for demonstration purposes only. In production, use a secure
      // Key Management Service (KMS) or hardware security module (HSM).
      const privateKeyBase64 = toBase64(privateKey);
      await this.genesisRepository.saveRootValidatorPrivateKey(
        validatorAddress,
        privateKeyBase64
      );
      this.logger.log(
        LogLevel.WARN,
        `Root validator private key stored (INSECURELY). Address: ${validatorAddress}. Consider using a KMS.`
      );
    } catch (error) {
      this.logger.error(
        `Failed to store root validator private key for address: ${validatorAddress}`,
        error
      );
      throw new GenesisProtocolError(
        GenesisProtocolErrorType.RepositoryError,
        `Failed to store root validator private key: ${error.message}`
      );
    }
  }
}