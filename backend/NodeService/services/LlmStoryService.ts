import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Trie } from 'merkle-patricia-tree';
import { MerkleProof } from '@ethereumjs/block';
import { keccak256 } from 'ethereumjs-util';
import { ethers } from 'ethers';
import { RpcNodeDataService } from '../evm/RpcNodeDataService'; // Assuming RpcNodeDataService is here
import { TrieNode } from '../evm/TrieNode'; // Assuming TrieNode is defined here

@Injectable()
export class LlmStoryService {
    private readonly logger = new Logger(LlmStoryService.name);
    private openai: OpenAI;
    private rpcNodeDataService: RpcNodeDataService;

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
        // Initialize RpcNodeDataService (you might need to adjust this based on your DI setup)
        this.rpcNodeDataService = new RpcNodeDataService(
            // Pass necessary dependencies here, e.g., an ethers provider
            new ethers.providers.JsonRpcProvider(this.configService.get<string>('ETHEREUM_RPC_URL')),
            // You might need to pass other parameters like chainId, etc.
        );
    }

    async generateStoryFromTransaction(transactionHash: string): Promise<string> {
        this.logger.log(`Generating story for transaction: ${transactionHash}`);

        // 1. Fetch Transaction Details
        const transaction = await this.rpcNodeDataService.getTransactionByHash(transactionHash);
        if (!transaction) {
            this.logger.error(`Transaction not found: ${transactionHash}`);
            throw new Error(`Transaction not found: ${transactionHash}`);
        }

        // 2. Fetch Transaction Receipt
        const receipt = await this.rpcNodeDataService.getTransactionReceipt(transactionHash);
        if (!receipt) {
            this.logger.error(`Transaction receipt not found: ${transactionHash}`);
            throw new Error(`Transaction receipt not found: ${transactionHash}`);
        }

        // 3. Fetch Block Details
        const block = await this.rpcNodeDataService.getBlockByNumber(transaction.blockNumber);
        if (!block) {
            this.logger.error(`Block not found for block number: ${transaction.blockNumber}`);
            throw new Error(`Block not found for block number: ${transaction.blockNumber}`);
        }

        // 4. Fetch EVM Trace/Debug Data
        // This is a crucial part. You'll need to adapt this to how your EVM simulation provides traces.
        // For this example, let's assume you have a method `getEvmTrace` that returns the trace.
        const trace = await this.rpcNodeDataService.getEvmTrace(transactionHash);
        if (!trace) {
            this.logger.warn(`EVM trace not available for transaction: ${transactionHash}`);
            // Continue without trace if not available, or throw an error if it's mandatory
        }

        // 5. Fetch Contract Code and State (if necessary)
        const contractCode = await this.rpcNodeDataService.getCode(transaction.to);
        // Fetching storage might be complex and require specific archival node access or simulation.
        // For simplicity, we'll omit deep state fetching here, but in a real scenario, you'd want to
        // reconstruct relevant parts of the state trie for context.

        // 6. Construct the Prompt for the LLM
        const prompt = this.buildPrompt(transaction, receipt, block, trace, contractCode);

        // 7. Call the LLM
        this.logger.log('Calling OpenAI API to generate story...');
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview', // Or your preferred model
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            });

            const story = completion.choices[0]?.message?.content;
            this.logger.log('Successfully generated story.');
            return story || 'Could not generate a story from the provided data.';
        } catch (error) {
            this.logger.error(`Error calling OpenAI API: ${error.message}`, error.stack);
            throw new Error(`Failed to generate story from LLM: ${error.message}`);
        }
    }

    private buildPrompt(
        transaction: any, // Replace with actual Transaction type
        receipt: any, // Replace with actual TransactionReceipt type
        block: any, // Replace with actual Block type
        trace: any[] | null, // Replace with actual Trace type
        contractCode: string,
    ): string {
        let prompt = `
        You are an expert storyteller with deep knowledge of Ethereum and smart contract interactions.
        Your task is to craft a compelling and informative narrative based on the provided blockchain transaction data.
        Explain what happened in a way that is understandable to both technical and non-technical audiences.

        Consider the following transaction details:

        **Transaction Information:**
        - Hash: ${transaction.hash}
        - From: ${transaction.from}
        - To: ${transaction.to}
        - Value: ${ethers.utils.formatEther(transaction.value)} ETH
        - Gas Price: ${ethers.utils.formatUnits(transaction.gasPrice, 'gwei')} Gwei
        - Gas Limit: ${transaction.gas}
        - Nonce: ${transaction.nonce}
        - Input Data: ${transaction.input} (This might be a function call or contract creation)

        **Transaction Receipt:**
        - Status: ${receipt.status ? 'Success' : 'Failed'}
        - Gas Used: ${receipt.gasUsed}
        - Logs: ${JSON.stringify(receipt.logs, null, 2)}
        - Cumulative Gas Used: ${receipt.cumulativeGasUsed}
        - Contract Address: ${receipt.contractAddress || 'N/A'}

        **Block Information:**
        - Number: ${block.number}
        - Hash: ${block.hash}
        - Timestamp: ${new Date(block.timestamp * 1000).toISOString()}
        - Miner: ${block.miner}

        **Contract Code (Runtime):**
        - Length: ${contractCode.length / 2} bytes
        - Start (first 100 chars): ${contractCode.substring(0, 100)}...

        **EVM Execution Trace (if available):**
        ${trace ? JSON.stringify(trace, null, 2) : 'No EVM trace data available.'}

        **Story Requirements:**
        1.  **Contextualize:** Briefly explain the purpose of the transaction and the involved contract (if known).
        2.  **Detail the Action:** Describe the core operation performed by the transaction. What was attempted? What was the outcome?
        3.  **Explain Key Data:** Decode and explain significant parts of the input data, logs, and events. What do they represent?
        4.  **Highlight Success/Failure:** If the transaction failed, explain why based on the receipt or trace. If it succeeded, describe the results.
        5.  **Incorporate Trace Insights:** If trace data is available, use it to explain intermediate steps or internal calls that led to the final outcome.
        6.  **Audience:** Write for a broad audience, explaining technical terms clearly.
        7.  **Tone:** Informative, engaging, and objective.

        Begin your story now:
        `;

        return prompt;
    }

    // Helper method to decode input data (this would be more sophisticated in a real app)
    private decodeInputData(input: string, contractABI: any[]): string {
        if (input === '0x') return 'No input data provided.';
        try {
            const fragment = ethers.utils.FunctionFragment.from(input);
            if (fragment) {
                const decodedArgs = ethers.utils.defaultAbiCoder.decode([fragment.format()], input);
                return `Function: ${fragment.name}(${decodedArgs.join(', ')})`;
            }
            return `Unknown contract call or data. Raw input: ${input}`;
        } catch (e) {
            return `Failed to decode input data. Raw input: ${input}`;
        }
    }
}
