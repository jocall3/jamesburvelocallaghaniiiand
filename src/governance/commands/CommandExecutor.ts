import { Command } from "../commands/Command";
import { PaymentGateway } from "../gateways/PaymentGateway";
import { SweepGateway } from "../gateways/SweepGateway";
import { TransactionGateway } from "../gateways/TransactionGateway";

/**
 * Class responsible for executing approved financial commands.
 * This acts as a central orchestrator for different types of financial operations.
 */
export class CommandExecutor {
    private paymentGateway: PaymentGateway;
    private sweepGateway: SweepGateway;
    private transactionGateway: TransactionGateway;

    /**
     * Constructs the CommandExecutor with necessary gateways.
     * @param paymentGateway - Gateway for handling payment commands.
     * @param sweepGateway - Gateway for handling sweep commands.
     * @param transactionGateway - Gateway for handling transaction viewing/retrieval.
     */
    constructor(
        paymentGateway: PaymentGateway,
        sweepGateway: SweepGateway,
        transactionGateway: TransactionGateway
    ) {
        this.paymentGateway = paymentGateway;
        this.sweepGateway = sweepGateway;
        this.transactionGateway = transactionGateway;
    }

    /**
     * Executes a given command based on its type.
     * @param command - The command to execute, which must adhere to the Command interface.
     * @returns A promise that resolves to the result of the command execution.
     * @throws Error if the command type is unknown or execution fails.
     */
    async execute(command: Command): Promise<any> {
        console.log(`Executing command: ${command.type} for context ${command.contextId}`);

        switch (command.type) {
            case 'MAKE_PAYMENT':
                // Assuming the command object structure for payment fits the gateway's execute method
                // For a real system, we'd ensure Command has necessary payment-specific properties.
                if (command.payload) {
                    return this.paymentGateway.processPayment(command.payload);
                }
                throw new Error("Payment command payload missing.");

            case 'SWEEP_FUNDS':
                // Assuming the command object structure for sweep fits the gateway's execute method
                if (command.payload) {
                    return this.sweepGateway.executeSweep(command.payload);
                }
                throw new Error("Sweep command payload missing.");
            
            case 'VIEW_TRANSACTIONS':
                // Transaction commands might be handled differently (e.g., using transactionGateway)
                // For this file's purpose, we focus on creation/modification commands (Payment/Sweep),
                // but we can placeholder a transaction fetch if needed.
                if (command.payload) {
                     return this.transactionGateway.getTransactions(command.payload);
                }
                throw new Error("Transaction command payload missing.");

            default:
                console.error(`Unknown command type received: ${command.type}`);
                throw new Error(`Unsupported command type: ${command.type}`);
        }
    }
}