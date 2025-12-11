using System;
using System.Threading.Tasks;
using Nethereum.EVM;
using Nethereum.EVM.BlockchainState;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Web3.Abstractions;

namespace EthereumService.Services
{
    /// <summary>
    /// A service to simulate Ethereum transactions using Nethereum's EVM.
    /// It fetches the required state from a live node and executes the transaction locally.
    /// </summary>
    public class EvmRunner
    {
        private readonly IWeb3 _web3;

        /// <summary>
        /// Initializes a new instance of the <see cref="EvmRunner"/> class.
        /// </summary>
        /// <param name="web3">The Web3 instance to connect to an Ethereum node, which must implement IWeb3.</param>
        public EvmRunner(IWeb3 web3)
        {
            _web3 = web3;
        }

        /// <summary>
        /// Simulates a transaction by fetching its context from the blockchain and executing it in the Nethereum EVM.
        /// </summary>
        /// <param name="transactionHash">The hash of the transaction to simulate.</param>
        /// <param name="traceEnabled">Whether to generate a step-by-step trace of the execution.</param>
        /// <param name="configureState">An optional action to manually configure the blockchain state before simulation,
        /// useful for complex transactions where automatic state retrieval may be incomplete.</param>
        /// <returns>The executed <see cref="Program"/> containing the results and trace.</returns>
        public async Task<Program> SimulateTransactionAsync(string transactionHash, bool traceEnabled = false, Action<ExecutionStateService> configureState = null)
        {
            // 1. Fetch transaction and block data from the node
            var txn = await _web3.Eth.Transactions.GetTransactionByHash.SendRequestAsync(transactionHash);
            if (txn == null)
            {
                throw new Exception($"Transaction with hash '{transactionHash}' not found.");
            }

            var block = await _web3.Eth.Blocks.GetBlockWithTransactionsHashesByNumber.SendRequestAsync(txn.BlockNumber);
            if (block == null)
            {
                throw new Exception($"Block with number '{txn.BlockNumber.Value}' not found.");
            }

            // 2. Set up the EVM environment based on the fetched data
            var txnInput = txn.ConvertToTransactionInput();
            
            // Default to MainNet if ChainId is not present in the historical transaction data
            txnInput.ChainId = txn.ChainId ?? new HexBigInteger(1);

            // We need the state of the blockchain *before* the transaction was executed
            var blockStateAt = new BlockParameter(new HexBigInteger(txn.BlockNumber.Value - 1));
            
            // Get the code to execute.
            // For contract creation, this is the init code from the transaction input.
            // For a message call, this is the runtime code of the target contract at the previous block.
            byte[] codeToExecute;
            if (string.IsNullOrEmpty(txn.To)) // Contract creation
            {
                codeToExecute = txn.Input.HexToByteArray();
            }
            else // Message call
            {
                var codeHex = await _web3.Eth.GetCode.SendRequestAsync(txn.To, blockStateAt);
                codeToExecute = codeHex.HexToByteArray();
            }

            // This service fetches blockchain state (code, storage, balance) from the node on demand
            var nodeDataService = new RpcNodeDataService(_web3.Eth, blockStateAt);
            var executionStateService = new ExecutionStateService(nodeDataService);

            // Allow caller to manually override or supplement state for complex scenarios
            configureState?.Invoke(executionStateService);
            
            var programContext = new ProgramContext(
                txnInput,
                executionStateService,
                null, // transactionHashes for BLOCKHASH opcode - can be null for basic simulation
                null, // coinbase for COINBASE opcode - can be null for basic simulation
                (long)txn.BlockNumber.Value,
                (long)block.Timestamp.Value
            );

            var program = new Program(codeToExecute, programContext);
            var evmSimulator = new EVMSimulator();

            // 3. Execute the transaction in the simulator
            try
            {
                // The parameters are: Program, Call Depth, Execution Index, Trace enabled
                program = await evmSimulator.ExecuteAsync(program, 0, 0, traceEnabled);
            }
            catch (Exception ex)
            {
                // Capture execution exceptions and attach them to the result for analysis
                if (program.ProgramResult != null)
                {
                    program.ProgramResult.Exception = ex;
                }
                else
                {
                    // If the exception happened before ProgramResult was initialized, rethrow
                    throw;
                }
            }

            return program;
        }
    }
}