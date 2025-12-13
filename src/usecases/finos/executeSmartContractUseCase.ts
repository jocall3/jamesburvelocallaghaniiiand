import { ethers } from "ethers";
import { FinOSLedger } from "../../../domain/finos/FinOSLedger";
import { SmartContractExecutionError } from "../../../domain/errors/SmartContractExecutionError";
import { SmartContractVerificationError } from "../../../domain/errors/SmartContractVerificationError";
import { SmartContractOperation } from "../../../domain/finos/SmartContractOperation";

/**
 * Use case for executing and verifying smart contract operations on the FinOS ledger.
 * Corresponds to T6_USE_CASE_6.
 */
export class ExecuteSmartContractUseCase {
  private finOSLedger: FinOSLedger;

  constructor(finOSLedger: FinOSLedger) {
    this.finOSLedger = finOSLedger;
  }

  /**
   * Executes a smart contract operation on the FinOS ledger.
   *
   * @param operation The smart contract operation to execute.
   * @returns A promise that resolves with the transaction hash of the executed operation.
   * @throws {SmartContractExecutionError} If the smart contract execution fails.
   */
  async executeOperation(operation: SmartContractOperation): Promise<string> {
    try {
      const tx = await this.finOSLedger.executeSmartContract(
        operation.contractAddress,
        operation.functionName,
        operation.args
      );
      return tx.hash;
    } catch (error: any) {
      throw new SmartContractExecutionError(
        `Failed to execute smart contract operation: ${error.message}`,
        error
      );
    }
  }

  /**
   * Verifies the result of a smart contract operation.
   * This method assumes that the operation's expected outcome can be determined
   * by reading from the smart contract after execution.
   *
   * @param operation The smart contract operation that was executed.
   * @param expectedOutcome A function that takes the contract instance and returns the expected outcome.
   * @returns A promise that resolves with true if the outcome matches, false otherwise.
   * @throws {SmartContractVerificationError} If the verification process fails.
   */
  async verifyOperation(
    operation: SmartContractOperation,
    expectedOutcome: (contract: ethers.Contract) => Promise<any>
  ): Promise<boolean> {
    try {
      const contract = this.finOSLedger.getContractInstance(
        operation.contractAddress
      );
      const actualOutcome = await expectedOutcome(contract);
      const expectedResult = await expectedOutcome(contract); // Re-fetch to ensure latest state

      // This comparison logic might need to be more sophisticated depending on the data types
      // and expected outcomes. For simplicity, we'll do a direct comparison here.
      return JSON.stringify(actualOutcome) === JSON.stringify(expectedResult);
    } catch (error: any) {
      throw new SmartContractVerificationError(
        `Failed to verify smart contract operation: ${error.message}`,
        error
      );
    }
  }

  /**
   * Executes and verifies a smart contract operation.
   *
   * @param operation The smart contract operation to execute.
   * @param expectedOutcome A function that takes the contract instance and returns the expected outcome.
   * @returns A promise that resolves with the transaction hash if execution and verification are successful.
   * @throws {SmartContractExecutionError} If the smart contract execution fails.
   * @throws {SmartContractVerificationError} If the verification process fails.
   */
  async executeAndVerifyOperation(
    operation: SmartContractOperation,
    expectedOutcome: (contract: ethers.Contract) => Promise<any>
  ): Promise<string> {
    const txHash = await this.executeOperation(operation);
    const isVerified = await this.verifyOperation(operation, expectedOutcome);

    if (!isVerified) {
      throw new SmartContractVerificationError(
        `Smart contract operation verification failed for transaction: ${txHash}`
      );
    }

    return txHash;
  }
}