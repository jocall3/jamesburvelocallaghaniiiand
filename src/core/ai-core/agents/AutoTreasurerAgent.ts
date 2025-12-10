import { Logger } from '../../utils/Logger';
import { Account } from '../../models/Account';
import { InvestmentOption } from '../../models/InvestmentOption';
import { Transaction } from '../../models/Transaction';
import { BankingService } from '../../services/BankingService';
import { YieldService } from '../../services/YieldService';
import { ExecutionService } from '../../services/ExecutionService';

/**
 * Configuration for the AutoTreasurerAgent.
 * Defines the rules and parameters for automated cash management.
 */
export interface AutoTreasurerConfig {
    /** Minimum cash balance to maintain in the primary operating account. */
    operatingCashThreshold: number;

    /** The ID of the primary operating/checking account to monitor. */
    primaryAccountId: string;

    /** The ID of the high-yield account where excess cash will be swept. */
    sweepDestinationAccountId: string;

    /** The minimum amount of excess cash required to trigger a sweep. */
    minSweepAmount: number;

    /** How often the agent should run its analysis cycle, in milliseconds. */
    runInterval: number;
}

/**
 * An autonomous agent responsible for managing cash sweeps and optimizing yield.
 * It periodically checks the balance of a primary operating account and moves
 * excess funds to a higher-yield account based on predefined rules.
 */
export class AutoTreasurerAgent {
    private readonly config: AutoTreasurerConfig;
    private readonly bankingService: BankingService;
    private readonly yieldService: YieldService;
    private readonly executionService: ExecutionService;
    private readonly logger: Logger;

    private isRunning: boolean = false;
    private timerId: NodeJS.Timeout | null = null;

    constructor(
        config: AutoTreasurerConfig,
        bankingService: BankingService,
        yieldService: YieldService,
        executionService: ExecutionService
    ) {
        this.config = config;
        this.bankingService = bankingService;
        this.yieldService = yieldService;
        this.executionService = executionService;
        this.logger = new Logger('AutoTreasurerAgent');
    }

    /**
     * Starts the agent's autonomous operation.
     * The agent will run its cycle immediately and then on the configured interval.
     */
    public start(): void {
        if (this.isRunning) {
            this.logger.warn('Agent is already running.');
            return;
        }
        this.isRunning = true;
        this.logger.info('AutoTreasurerAgent started.');

        // Run the cycle immediately on start, then set the interval.
        this.runCycle().catch(error => {
            this.logger.error('Initial run cycle failed on start.', error);
        });

        this.timerId = setInterval(() => this.runCycle(), this.config.runInterval);
    }

    /**
     * Stops the agent's autonomous operation.
     */
    public stop(): void {
        if (!this.isRunning) {
            this.logger.warn('Agent is not running.');
            return;
        }
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isRunning = false;
        this.logger.info('AutoTreasurerAgent stopped.');
    }

    /**
     * The main execution loop for the agent.
     * Fetches data, analyzes it against the rules, and executes transactions if needed.
     */
    private async runCycle(): Promise<void> {
        this.logger.info('Starting new treasury management cycle.');
        try {
            // Step 1: Fetch current state (account balances)
            const primaryAccount = await this.bankingService.getAccountById(this.config.primaryAccountId);
            const destinationAccount = await this.bankingService.getAccountById(this.config.sweepDestinationAccountId);

            if (!primaryAccount) {
                this.logger.error(`Could not find primary account with ID: ${this.config.primaryAccountId}. Halting cycle.`);
                return;
            }
             if (!destinationAccount) {
                this.logger.error(`Could not find destination account with ID: ${this.config.sweepDestinationAccountId}. Halting cycle.`);
                return;
            }

            this.logger.info(`Primary Account (${primaryAccount.id}) Balance: ${primaryAccount.balance.toFixed(2)}`);
            this.logger.info(`Operating Cash Threshold: ${this.config.operatingCashThreshold.toFixed(2)}`);

            // Step 2: Analyze and make a decision based on rules
            const excessCash = primaryAccount.balance - this.config.operatingCashThreshold;

            if (excessCash >= this.config.minSweepAmount) {
                this.logger.info(`Excess cash of ${excessCash.toFixed(2)} detected. Preparing to sweep.`);
                
                // A more advanced version could use `findBestYieldOption` to dynamically select a destination.
                // For this implementation, the destination is fixed in the config.

                // Step 3: Execute the sweep transaction
                await this.executeSweep(primaryAccount, destinationAccount, excessCash);

            } else {
                this.logger.info('No sweep required. Cash balance is within threshold or below minimum sweep amount.');
            }

        } catch (error) {
            this.logger.error('An error occurred during the treasury management cycle.', error);
        } finally {
            this.logger.info('Treasury management cycle finished.');
        }
    }

    /**
     * Executes the cash sweep transfer between two accounts.
     * @param fromAccount The source account for the sweep.
     * @param toAccount The destination account for the sweep.
     * @param amount The amount of money to transfer.
     */
    private async executeSweep(fromAccount: Account, toAccount: Account, amount: number): Promise<void> {
        // Round to 2 decimal places to avoid floating point issues with currency
        const sweepAmount = Math.floor(amount * 100) / 100;

        this.logger.info(`Executing sweep of ${sweepAmount.toFixed(2)} from ${fromAccount.id} to ${toAccount.id}.`);
        try {
            const transaction: Omit<Transaction, 'id'> = {
                fromAccountId: fromAccount.id,
                toAccountId: toAccount.id,
                amount: sweepAmount,
                description: 'Automated Treasury Sweep for Yield Optimization',
                date: new Date(),
                status: 'pending', // Status will be updated by the execution service
            };

            const executedTransaction = await this.executionService.executeTransfer(transaction);
            this.logger.info(`Sweep successful. Transaction ID: ${executedTransaction.id}, Status: ${executedTransaction.status}`);
        } catch (error) {
            this.logger.error(`Failed to execute sweep from ${fromAccount.id} to ${toAccount.id}.`, error);
            // In a real system, this might trigger an alert.
            throw error;
        }
    }

    /**
     * Finds the best available investment option based on yield.
     * Note: This method is a placeholder for future, more advanced yield optimization logic.
     * @returns A promise that resolves to the best `InvestmentOption` or null if none are found.
     */
    private async findBestYieldOption(): Promise<InvestmentOption | null> {
        try {
            const options = await this.yieldService.getAvailableOptions();
            if (options.length === 0) {
                this.logger.info('No yield options available.');
                return null;
            }
            // Simple logic: return the option with the highest APY
            const bestOption = options.reduce((prev, current) => (prev.apy > current.apy) ? prev : current);
            this.logger.info(`Found best yield option: ${bestOption.name} with APY ${bestOption.apy}%`);
            return bestOption;
        } catch (error) {
            this.logger.error('Failed to fetch yield options.', error);
            return null;
        }
    }
}