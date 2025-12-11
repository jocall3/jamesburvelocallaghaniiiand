import { Request, Response } from "express";
import { EVMService } from "../services/EVMService";
import { SearchService } from "../services/SearchService";
import { LLMService } from "../services/LLMService";
import { Transaction } from "../types/Transaction";
import { Block } from "../types/Block";
import { TransactionReceipt } from "../types/TransactionReceipt";

export class NarrativeController {
  private evmService: EVMService;
  private searchService: SearchService;
  private llmService: LLMService;

  constructor() {
    this.evmService = new EVMService();
    this.searchService = new SearchService();
    this.llmService = new LLMService();
  }

  public async generateStory(req: Request, res: Response): Promise<void> {
    const { transactionHash } = req.params;

    try {
      // 1. Retrieve transaction details, receipt, and block information from the blockchain
      const [transaction, receipt, block]: [Transaction, TransactionReceipt, Block] = await Promise.all([
        this.evmService.getTransactionByHash(transactionHash),
        this.evmService.getTransactionReceipt(transactionHash),
        this.evmService.getBlockByNumber(parseInt(await this.evmService.getTransactionByHash(transactionHash).then(tx => tx.blockNumber!))) // Ensure blockNumber is not undefined
      ]);

      // 2. Perform a Google search based on the transaction and contract interaction
      const searchResults = await this.searchService.googleSearch(
        `Ethereum transaction ${transactionHash} ${transaction.to} ${transaction.input}`
      );

      // 3. Simulate the transaction using the EVM service to get detailed execution traces and logs
      const simulationResult = await this.evmService.simulateTransaction(transactionHash);

      // 4. Gather relevant data for the story
      const storyData = {
        transaction: transaction,
        receipt: receipt,
        block: block,
        searchResults: searchResults,
        simulation: simulationResult,
      };

      // 5. Use the LLM to generate a story based on the gathered data
      const story = await this.llmService.generateStoryFromData(storyData);

      // 6. Send the generated story back to the client
      res.status(200).json({ story });
    } catch (error) {
      console.error("Error generating narrative:", error);
      res.status(500).json({ error: "Failed to generate narrative" });
    }
  }
}
