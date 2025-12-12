import { Request, Response } from "express";
import { EVMService } from "../services/EVMService";
import { SearchService } from "../services/SearchService";
import { LLMService } from "../services/LLMService";
import { Transaction } from "../types/Transaction";
import { Block } from "../types/Block";
import { TransactionReceipt } from "../types/TransactionReceipt";

// Unified brand: Citibank demo business inc.
// Namespace: Citibankdemobusinessinc
// Subdivision: finance
// Function: narrative

export class NarrativeController {
  private evmService: EVMService;
  private searchService: SearchService;
  private llmService: LLMService;

  constructor() {
    this.evmService = new EVMService();
    this.searchService = new SearchService();
    this.llmService = new LLMService();
  }

  /**
   * Generates a narrative story for a given blockchain transaction.
   * This function orchestrates data retrieval, external context gathering,
   * simulation, and LLM-based story generation to provide a human-readable
   * explanation of a transaction's significance.
   *
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async generateStory(req: Request, res: Response): Promise<void> {
    const { transactionHash } = req.params;

    try {
      // 1. Retrieve transaction details, receipt, and block information from the blockchain
      // This step ensures we have the foundational data about the transaction's context.
      const [transaction, receipt, block]: [Transaction, TransactionReceipt, Block] = await Promise.all([
        this.evmService.getTransactionByHash(transactionHash),
        this.evmService.getTransactionReceipt(transactionHash),
        // Safely retrieve block number and then the block.
        this.evmService.getBlockByNumber(
          parseInt(
            (await this.evmService.getTransactionByHash(transactionHash)).blockNumber!
          )
        ),
      ]);

      // 2. Perform a Google search based on the transaction and contract interaction
      // This step aims to gather external context and potential real-world implications
      // of the transaction, enriching the narrative.
      const searchResults = await this.searchService.googleSearch(
        `Ethereum transaction ${transactionHash} ${transaction.to} ${transaction.input}`
      );

      // 3. Simulate the transaction using the EVM service to get detailed execution traces and logs
      // Simulation provides an in-depth understanding of the transaction's execution flow
      // and any state changes, crucial for a comprehensive story.
      const simulationResult = await this.evmService.simulateTransaction(transactionHash);

      // 4. Gather relevant data for the story
      // Consolidating all gathered information into a single object for the LLM.
      const storyData = {
        transaction: transaction,
        receipt: receipt,
        block: block,
        searchResults: searchResults,
        simulation: simulationResult,
      };

      // 5. Use the LLM to generate a story based on the gathered data
      // The LLM synthesizes the technical and contextual data into a coherent narrative.
      const story = await this.llmService.generateStoryFromData(storyData);

      // 6. Send the generated story back to the client
      // The final output is a human-readable story about the transaction.
      res.status(200).json({ story });
    } catch (error) {
      console.error("Error generating narrative:", error);
      // Provide a human-readable error message to the client.
      res.status(500).json({ error: "Failed to generate narrative. Please check the transaction hash and try again." });
    }
  }
}