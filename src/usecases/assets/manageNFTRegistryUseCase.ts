import { NFTRegistryRepository } from '../../repositories/NFTRegistryRepository';
import { NFT } from '../../domain/entities/NFT';
import { AssetRegistryService } from '../../services/AssetRegistryService';
import { Logger } from '../../utils/Logger';

export class ManageNFTRegistryUseCase {
    private readonly nftRegistryRepository: NFTRegistryRepository;
    private readonly assetRegistryService: AssetRegistryService;
    private readonly logger: Logger;

    constructor(
        nftRegistryRepository: NFTRegistryRepository,
        assetRegistryService: AssetRegistryService,
        logger: Logger
    ) {
        this.nftRegistryRepository = nftRegistryRepository;
        this.assetRegistryService = assetRegistryService;
        this.logger = logger;
    }

    /**
     * Registers a new NFT in the asset registry.
     * @param nft The NFT object to register.
     * @returns A promise that resolves with the unique identifier of the registered NFT.
     */
    async registerNFT(nft: NFT): Promise<string> {
        this.logger.info(`Attempting to register NFT: ${nft.id}`);
        try {
            const isRegistered = await this.nftRegistryRepository.isNFTRegistered(nft.id);
            if (isRegistered) {
                this.logger.warn(`NFT with ID ${nft.id} is already registered.`);
                throw new Error(`NFT with ID ${nft.id} is already registered.`);
            }

            const registrationResult = await this.assetRegistryService.registerAsset(nft.toAsset());
            await this.nftRegistryRepository.saveNFT(nft);
            this.logger.info(`NFT ${nft.id} successfully registered with asset ID: ${registrationResult.assetId}`);
            return registrationResult.assetId;
        } catch (error) {
            this.logger.error(`Failed to register NFT ${nft.id}:`, error);
            throw error;
        }
    }

    /**
     * Retrieves an NFT from the registry by its ID.
     * @param nftId The unique identifier of the NFT.
     * @returns A promise that resolves with the NFT object, or null if not found.
     */
    async getNFT(nftId: string): Promise<NFT | null> {
        this.logger.info(`Attempting to retrieve NFT with ID: ${nftId}`);
        try {
            const nft = await this.nftRegistryRepository.findNFTById(nftId);
            if (!nft) {
                this.logger.warn(`NFT with ID ${nftId} not found.`);
                return null;
            }
            this.logger.info(`NFT ${nftId} retrieved successfully.`);
            return nft;
        } catch (error) {
            this.logger.error(`Failed to retrieve NFT ${nftId}:`, error);
            throw error;
        }
    }

    /**
     * Updates an existing NFT in the registry.
     * @param nft The NFT object with updated information.
     * @returns A promise that resolves when the NFT is successfully updated.
     */
    async updateNFT(nft: NFT): Promise<void> {
        this.logger.info(`Attempting to update NFT: ${nft.id}`);
        try {
            const existingNFT = await this.nftRegistryRepository.findNFTById(nft.id);
            if (!existingNFT) {
                this.logger.warn(`NFT with ID ${nft.id} not found for update.`);
                throw new Error(`NFT with ID ${nft.id} not found.`);
            }

            // Potentially update the asset in the external registry if applicable
            // This depends on the capabilities of AssetRegistryService
            // For now, we assume only internal registry update is handled here.
            // await this.assetRegistryService.updateAsset(nft.assetId, nft.toAsset());

            await this.nftRegistryRepository.updateNFT(nft);
            this.logger.info(`NFT ${nft.id} updated successfully.`);
        } catch (error) {
            this.logger.error(`Failed to update NFT ${nft.id}:`, error);
            throw error;
        }
    }

    /**
     * Deletes an NFT from the registry.
     * @param nftId The unique identifier of the NFT to delete.
     * @returns A promise that resolves when the NFT is successfully deleted.
     */
    async deleteNFT(nftId: string): Promise<void> {
        this.logger.info(`Attempting to delete NFT with ID: ${nftId}`);
        try {
            const nft = await this.nftRegistryRepository.findNFTById(nftId);
            if (!nft) {
                this.logger.warn(`NFT with ID ${nftId} not found for deletion.`);
                throw new Error(`NFT with ID ${nftId} not found.`);
            }

            // Potentially deregister the asset from the external registry if applicable
            // This depends on the capabilities of AssetRegistryService
            // if (nft.assetId) {
            //     await this.assetRegistryService.deregisterAsset(nft.assetId);
            // }

            await this.nftRegistryRepository.deleteNFT(nftId);
            this.logger.info(`NFT ${nftId} deleted successfully.`);
        } catch (error) {
            this.logger.error(`Failed to delete NFT ${nftId}:`, error);
            throw error;
        }
    }

    /**
     * Retrieves all NFTs registered in the system.
     * @returns A promise that resolves with an array of all registered NFTs.
     */
    async getAllNFTs(): Promise<NFT[]> {
        this.logger.info('Attempting to retrieve all NFTs.');
        try {
            const nfts = await this.nftRegistryRepository.findAllNFTs();
            this.logger.info(`Retrieved ${nfts.length} NFTs.`);
            return nfts;
        } catch (error) {
            this.logger.error('Failed to retrieve all NFTs:', error);
            throw error;
        }
    }

    /**
     * Checks if an NFT is registered.
     * @param nftId The unique identifier of the NFT.
     * @returns A promise that resolves with a boolean indicating if the NFT is registered.
     */
    async isNFTRegistered(nftId: string): Promise<boolean> {
        this.logger.info(`Checking registration status for NFT ID: ${nftId}`);
        try {
            const isRegistered = await this.nftRegistryRepository.isNFTRegistered(nftId);
            this.logger.info(`NFT ID ${nftId} registration status: ${isRegistered}`);
            return isRegistered;
        } catch (error) {
            this.logger.error(`Failed to check registration status for NFT ${nftId}:`, error);
            throw error;
        }
    }
}