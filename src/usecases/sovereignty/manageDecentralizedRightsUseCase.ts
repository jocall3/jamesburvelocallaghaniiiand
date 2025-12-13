import { injectable, inject } from 'tsyringe';
import { ethers } from 'ethers';
import { DecentralizedRightsRegistry } from '../../infrastructure/smart-contracts/DecentralizedRightsRegistry';
import { BlockchainGateway } from '../../infrastructure/blockchain/BlockchainGateway';
import { Logger } from '../../utils/Logger';

/**
 * T4_USE_CASE_4: Business logic for managing decentralized rights and permissions using smart contracts.
 * This use case handles the creation, assignment, revocation, and querying of rights
 * stored on a decentralized ledger (smart contract).
 */
@injectable()
export class ManageDecentralizedRightsUseCase {
    private readonly logger: Logger;
    private readonly rightsRegistry: DecentralizedRightsRegistry;
    private readonly blockchainGateway: BlockchainGateway;

    constructor(
        logger: Logger,
        @inject('DecentralizedRightsRegistry') rightsRegistry: DecentralizedRightsRegistry,
        @inject('BlockchainGateway') blockchainGateway: BlockchainGateway
    ) {
        this.logger = logger;
        this.rightsRegistry = rightsRegistry;
        this.blockchainGateway = blockchainGateway;
        this.logger.info('ManageDecentralizedRightsUseCase initialized.');
    }

    /**
     * Creates a new decentralized right definition in the smart contract.
     * @param rightId A unique identifier for the right (e.g., a hash or UUID).
     * @param description A human-readable description of the right.
     * @param metadataURI URI pointing to detailed metadata about the right structure.
     * @returns The transaction hash if successful.
     */
    public async defineNewRight(
        rightId: string,
        description: string,
        metadataURI: string
    ): Promise<string> {
        this.logger.debug(`Attempting to define new right: ${rightId}`);
        
        if (!this.blockchainGateway.isReady()) {
            throw new Error('Blockchain gateway is not connected.');
        }

        try {
            const signer = this.blockchainGateway.getSigner();
            const contract = this.rightsRegistry.connect(signer);

            // Assuming rightId needs to be converted to a bytes32 or similar format expected by the contract
            const rightIdBytes32 = ethers.utils.formatBytes32String(rightId);

            this.logger.info(`Calling defineRight(${rightIdBytes32}, ${description}, ${metadataURI})`);
            
            const tx = await contract.defineRight(
                rightIdBytes32,
                description,
                metadataURI
            );

            this.logger.info(`Right definition transaction sent. Hash: ${tx.hash}`);
            
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            this.logger.info(`Right definition confirmed in block: ${receipt.blockNumber}`);
            
            return tx.hash;

        } catch (error) {
            this.logger.error(`Error defining new right ${rightId}:`, error);
            throw new Error(`Failed to define decentralized right: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Assigns a defined right to a specific principal (user/address) on the blockchain.
     * @param rightId The unique identifier of the right being assigned.
     * @param principalAddress The address receiving the right.
     * @param validityPeriodSeconds How long the right is valid for, in seconds (0 for perpetual).
     * @param contextData Optional data related to the assignment context (e.g., transaction ID).
     * @returns The transaction hash if successful.
     */
    public async assignRightToPrincipal(
        rightId: string,
        principalAddress: string,
        validityPeriodSeconds: number,
        contextData: string = ''
    ): Promise<string> {
        this.logger.debug(`Assigning right ${rightId} to ${principalAddress}`);

        if (!ethers.utils.isAddress(principalAddress)) {
            throw new Error('Invalid principal address provided.');
        }

        try {
            const signer = this.blockchainGateway.getSigner();
            const contract = this.rightsRegistry.connect(signer);
            const rightIdBytes32 = ethers.utils.formatBytes32String(rightId);
            const expiryTime = validityPeriodSeconds > 0 
                ? Math.floor(Date.now() / 1000) + validityPeriodSeconds
                : 0; // 0 typically means indefinite/until revoked

            this.logger.info(`Calling assignRight(${rightIdBytes32}, ${principalAddress}, ${expiryTime}, ${contextData})`);

            const tx = await contract.assignRight(
                rightIdBytes32,
                principalAddress,
                expiryTime,
                contextData
            );

            this.logger.info(`Right assignment transaction sent. Hash: ${tx.hash}`);
            await tx.wait();
            this.logger.info(`Right assignment confirmed for ${principalAddress}.`);
            
            return tx.hash;

        } catch (error) {
            this.logger.error(`Error assigning right ${rightId} to ${principalAddress}:`, error);
            throw new Error(`Failed to assign decentralized right: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Revokes an existing right assignment from a principal.
     * @param rightId The unique identifier of the right being revoked.
     * @param principalAddress The address whose right is being revoked.
     * @returns The transaction hash if successful.
     */
    public async revokeRightFromPrincipal(
        rightId: string,
        principalAddress: string
    ): Promise<string> {
        this.logger.warn(`Attempting to revoke right ${rightId} from ${principalAddress}`);

        if (!ethers.utils.isAddress(principalAddress)) {
            throw new Error('Invalid principal address provided.');
        }

        try {
            const signer = this.blockchainGateway.getSigner();
            const contract = this.rightsRegistry.connect(signer);
            const rightIdBytes32 = ethers.utils.formatBytes32String(rightId);

            this.logger.info(`Calling revokeRight(${rightIdBytes32}, ${principalAddress})`);

            const tx = await contract.revokeRight(
                rightIdBytes32,
                principalAddress
            );

            this.logger.info(`Right revocation transaction sent. Hash: ${tx.hash}`);
            await tx.wait();
            this.logger.info(`Right successfully revoked for ${principalAddress}.`);
            
            return tx.hash;

        } catch (error) {
            this.logger.error(`Error revoking right ${rightId} from ${principalAddress}:`, error);
            throw new Error(`Failed to revoke decentralized right: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Checks if a specific principal holds a specific right.
     * @param rightId The unique identifier of the right.
     * @param principalAddress The address to check.
     * @returns True if the principal holds the right, false otherwise.
     */
    public async checkRight(
        rightId: string,
        principalAddress: string
    ): Promise<boolean> {
        this.logger.debug(`Checking if ${principalAddress} holds right ${rightId}`);

        if (!ethers.utils.isAddress(principalAddress)) {
            throw new Error('Invalid principal address provided.');
        }

        try {
            const contract = this.rightsRegistry.connect(this.blockchainGateway.getProvider());
            const rightIdBytes32 = ethers.utils.formatBytes32String(rightId);

            // Assuming the contract has a view function like 'hasRight'
            const hasRight = await contract.hasRight(rightIdBytes32, principalAddress);
            
            this.logger.debug(`Result for ${principalAddress} on ${rightId}: ${hasRight}`);
            return hasRight;

        } catch (error) {
            this.logger.error(`Error checking right ${rightId} for ${principalAddress}:`, error);
            // If the contract call fails (e.g., rightId doesn't exist), we might default to false or rethrow based on business rules.
            // Here, we rethrow as a failure to query is usually critical.
            throw new Error(`Failed to query decentralized right status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves the details of a specific right definition.
     * @param rightId The unique identifier of the right.
     * @returns An object containing the right's details (description, metadataURI, etc.).
     */
    public async getRightDetails(rightId: string): Promise<{ description: string, metadataURI: string, exists: boolean }> {
        this.logger.debug(`Fetching details for right ${rightId}`);

        try {
            const contract = this.rightsRegistry.connect(this.blockchainGateway.getProvider());
            const rightIdBytes32 = ethers.utils.formatBytes32String(rightId);

            // Assuming the contract has a mapping or struct accessor function, e.g., 'getRightDefinition'
            const definition = await contract.getRightDefinition(rightIdBytes32);

            if (definition.description === '' && definition.metadataURI === '') {
                return { description: '', metadataURI: '', exists: false };
            }

            return {
                description: definition.description,
                metadataURI: definition.metadataURI,
                exists: true
            };

        } catch (error) {
            this.logger.warn(`Could not retrieve details for right ${rightId}. It might not exist or an RPC error occurred.`, error);
            // If the contract call reverts because the ID is not found, we return not found.
            return { description: '', metadataURI: '', exists: false };
        }
    }
}