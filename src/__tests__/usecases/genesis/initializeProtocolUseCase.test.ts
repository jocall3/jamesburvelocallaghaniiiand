import { initializeProtocolUseCase } from '../../../usecases/genesis/initializeProtocolUseCase';
import { ProtocolRepository } from '../../../repositories/ProtocolRepository';
import { Protocol } from '../../../domain/entities/Protocol';

// Mocking the ProtocolRepository
const mockProtocolRepository: ProtocolRepository = {
    save: jest.fn(),
    get: jest.fn(),
    exists: jest.fn(),
};

describe('initializeProtocolUseCase', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    it('should initialize the protocol if it does not exist', async () => {
        // Arrange
        const initialProtocolData = {
            version: '1.0.0',
            genesisBlock: 'genesis_hash_123',
            timestamp: 1678886400,
            networkId: 'mainnet',
        };

        (mockProtocolRepository.exists as jest.Mock).mockResolvedValue(false);
        (mockProtocolRepository.save as jest.Mock).mockResolvedValue(undefined);

        // Act
        await initializeProtocolUseCase(mockProtocolRepository, initialProtocolData);

        // Assert
        expect(mockProtocolRepository.exists).toHaveBeenCalledTimes(1);
        expect(mockProtocolRepository.save).toHaveBeenCalledTimes(1);
        expect(mockProtocolRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                version: initialProtocolData.version,
                genesisBlock: initialProtocolData.genesisBlock,
                timestamp: initialProtocolData.timestamp,
                networkId: initialProtocolData.networkId,
            })
        );
    });

    it('should not initialize the protocol if it already exists', async () => {
        // Arrange
        const initialProtocolData = {
            version: '1.0.0',
            genesisBlock: 'genesis_hash_123',
            timestamp: 1678886400,
            networkId: 'mainnet',
        };

        (mockProtocolRepository.exists as jest.Mock).mockResolvedValue(true);

        // Act
        await initializeProtocolUseCase(mockProtocolRepository, initialProtocolData);

        // Assert
        expect(mockProtocolRepository.exists).toHaveBeenCalledTimes(1);
        expect(mockProtocolRepository.save).not.toHaveBeenCalled();
    });

    it('should throw an error if repository save fails', async () => {
        // Arrange
        const initialProtocolData = {
            version: '1.0.0',
            genesisBlock: 'genesis_hash_123',
            timestamp: 1678886400,
            networkId: 'mainnet',
        };
        const saveError = new Error('Database error during save');

        (mockProtocolRepository.exists as jest.Mock).mockResolvedValue(false);
        (mockProtocolRepository.save as jest.Mock).mockRejectedValue(saveError);

        // Act & Assert
        await expect(initializeProtocolUseCase(mockProtocolRepository, initialProtocolData)).rejects.toThrow(saveError);
        expect(mockProtocolRepository.exists).toHaveBeenCalledTimes(1);
        expect(mockProtocolRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle missing optional fields gracefully if the repository allows', async () => {
        // Arrange
        const initialProtocolData = {
            version: '1.1.0',
            genesisBlock: 'another_genesis_hash',
            timestamp: 1678886500,
            // networkId is missing
        };

        // Assuming the Protocol entity can handle a missing networkId or defaults it
        (mockProtocolRepository.exists as jest.Mock).mockResolvedValue(false);
        (mockProtocolRepository.save as jest.Mock).mockResolvedValue(undefined);

        // Act
        await initializeProtocolUseCase(mockProtocolRepository, initialProtocolData);

        // Assert
        expect(mockProtocolRepository.exists).toHaveBeenCalledTimes(1);
        expect(mockProtocolRepository.save).toHaveBeenCalledTimes(1);
        expect(mockProtocolRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                version: initialProtocolData.version,
                genesisBlock: initialProtocolData.genesisBlock,
                timestamp: initialProtocolData.timestamp,
                networkId: undefined, // Or whatever the default/expected behavior is
            })
        );
    });

    it('should throw an error if required fields are missing in initial data', async () => {
        // Arrange
        const initialProtocolData = {
            // version is missing
            genesisBlock: 'genesis_hash_123',
            timestamp: 1678886400,
            networkId: 'mainnet',
        };

        // Act & Assert
        // This test assumes the use case or Protocol entity itself validates required fields.
        // If validation is external, this test might need adjustment.
        await expect(initializeProtocolUseCase(mockProtocolRepository, initialProtocolData as any)).rejects.toThrow(
            /version is required/i // Example error message, adjust based on actual validation
        );
        expect(mockProtocolRepository.exists).not.toHaveBeenCalled();
        expect(mockProtocolRepository.save).not.toHaveBeenCalled();
    });
});