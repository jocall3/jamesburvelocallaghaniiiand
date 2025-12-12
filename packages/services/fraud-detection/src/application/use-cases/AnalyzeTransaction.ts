import { Transaction } from '../../domain/entities/Transaction';
import { FraudDetectionService } from '../../domain/services/FraudDetectionService';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { NotificationService } from '../../domain/services/NotificationService';
import { Logger } from '../../infrastructure/logging/Logger';

export class AnalyzeTransaction {
    private readonly fraudDetectionService: FraudDetectionService;
    private readonly transactionRepository: TransactionRepository;
    private readonly notificationService: NotificationService;
    private readonly logger: Logger;

    constructor(
        fraudDetectionService: FraudDetectionService,
        transactionRepository: TransactionRepository,
        notificationService: NotificationService,
        logger: Logger
    ) {
        this.fraudDetectionService = fraudDetectionService;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
        this.logger = logger;
    }

    async execute(transactionId: string): Promise<void> {
        try {
            this.logger.info(`Analyzing transaction with ID: ${transactionId}`);

            const transaction = await this.transactionRepository.getTransactionById(transactionId);

            if (!transaction) {
                this.logger.warn(`Transaction with ID ${transactionId} not found.`);
                return; // Or throw an exception, depending on desired behavior
            }

            const isFraudulent = await this.fraudDetectionService.isFraudulent(transaction);

            if (isFraudulent) {
                this.logger.warn(`Transaction with ID ${transactionId} is potentially fraudulent.`);
                await this.notificationService.notifyFraudulentTransaction(transaction);
                transaction.status = 'flagged'; // Update transaction status
                await this.transactionRepository.updateTransaction(transaction);
            } else {
                this.logger.info(`Transaction with ID ${transactionId} is not fraudulent.`);
                transaction.status = 'approved'; // Update transaction status
                await this.transactionRepository.updateTransaction(transaction);
            }

            this.logger.info(`Transaction analysis completed for ID: ${transactionId}`);

        } catch (error) {
            this.logger.error(`Error analyzing transaction with ID ${transactionId}: ${error}`);
            // Consider more sophisticated error handling, like retries or dead-letter queues
            throw error; // Re-throw to allow the calling service to handle the error
        }
    }
}