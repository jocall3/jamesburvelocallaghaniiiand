using Nethereum.EVM;
using Nethereum.EVM.BlockchainState;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Web3;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace EthereumService.Engine
{
    public class SimulationRequest
    {
        public string TransactionHash { get; set; }
        public Transaction Transaction { get; set; }
        public BlockWithTransactionsHashes Block { get; set; }
        public string ByteCode { get; set; }
    }

    public class SimulationResult
    {
        public string TransactionHash { get; set; }
        public ProgramResult ProgramResult { get; set; }
        public bool IsRevert { get; set; }
        public string ErrorMessage { get; set; }
        public long ExecutionTimeMs { get; set; }
        public Exception SystemException { get; set; }
    }

    public class ParallelExecutor
    {
        private readonly IWeb3 _web3;
        private readonly int _maxDegreeOfParallelism;

        public ParallelExecutor(IWeb3 web3, int maxDegreeOfParallelism = 10)
        {
            _web3 = web3 ?? throw new ArgumentNullException(nameof(web3));
            _maxDegreeOfParallelism = maxDegreeOfParallelism;
        }

        /// <summary>
        /// Orchestrates the parallel retrieval and simulation of multiple transaction hashes.
        /// </summary>
        public async Task<List<SimulationResult>> ExecuteBatchByHashesAsync(IEnumerable<string> transactionHashes, CancellationToken cancellationToken = default)
        {
            var results = new ConcurrentBag<SimulationResult>();
            var parallelOptions = new ParallelOptions
            {
                MaxDegreeOfParallelism = _maxDegreeOfParallelism,
                CancellationToken = cancellationToken
            };

            await Parallel.ForEachAsync(transactionHashes, parallelOptions, async (txHash, token) =>
            {
                var result = await ProcessSingleTransactionAsync(txHash);
                results.Add(result);
            });

            return results.ToList();
        }

        /// <summary>
        /// Executes simulations for pre-loaded requests in parallel.
        /// </summary>
        public async Task<List<SimulationResult>> ExecuteBatchRequestsAsync(IEnumerable<SimulationRequest> requests, CancellationToken cancellationToken = default)
        {
            var results = new ConcurrentBag<SimulationResult>();
            var parallelOptions = new ParallelOptions
            {
                MaxDegreeOfParallelism = _maxDegreeOfParallelism,
                CancellationToken = cancellationToken
            };

            await Parallel.ForEachAsync(requests, parallelOptions, async (request, token) =>
            {
                var result = await SimulateRequestAsync(request);
                results.Add(result);
            });

            return results.ToList();
        }

        private async Task<SimulationResult> ProcessSingleTransactionAsync(string transactionHash)
        {
            try
            {
                // 1. Fetch Data
                var txn = await _web3.Eth.Transactions.GetTransactionByHash.SendRequestAsync(transactionHash);
                if (txn == null) 
                    throw new Exception($"Transaction {transactionHash} not found.");

                var block = await _web3.Eth.Blocks.GetBlockWithTransactionsHashesByNumber.SendRequestAsync(txn.BlockNumber);
                
                string code = null;
                if (txn.To != null)
                {
                    // Fetch code at the state of the previous block
                    var prevBlock = new BlockParameter(new HexBigInteger(txn.BlockNumber.Value - 1));
                    code = await _web3.Eth.GetCode.SendRequestAsync(txn.To, prevBlock);
                }

                var request = new SimulationRequest
                {
                    TransactionHash = transactionHash,
                    Transaction = txn,
                    Block = block,
                    ByteCode = code
                };

                // 2. Simulate
                return await SimulateRequestAsync(request);
            }
            catch (Exception ex)
            {
                return new SimulationResult
                {
                    TransactionHash = transactionHash,
                    SystemException = ex,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<SimulationResult> SimulateRequestAsync(SimulationRequest request)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new SimulationResult { TransactionHash = request.TransactionHash };

            try
            {
                var txn = request.Transaction;
                var block = request.Block;

                // Setup Inputs
                var txnInput = new CallInput
                {
                    From = txn.From,
                    To = txn.To,
                    Data = txn.Input,
                    Value = txn.Value ?? new HexBigInteger(0),
                    ChainId = new HexBigInteger(1), // Assuming mainnet or parameterized
                    Gas = txn.Gas,
                    GasPrice = txn.GasPrice
                };

                // Configure State Service (Fork from previous block)
                var forkBlockNumber = new HexBigInteger(txn.BlockNumber.Value - 1);
                var nodeDataService = new RpcNodeDataService(_web3.Eth, new BlockParameter(forkBlockNumber));
                var executionStateService = new ExecutionStateService(nodeDataService);

                // Setup Context
                var programContext = new ProgramContext(
                    txnInput, 
                    executionStateService, 
                    null, 
                    (long)txn.BlockNumber.Value, 
                    (long)block.Timestamp.Value
                );

                // Initialize EVM
                byte[] programByteCode = request.ByteCode?.HexToByteArray() ?? Array.Empty<byte>();
                
                // If it is a contract creation
                if (txn.To == null && !string.IsNullOrEmpty(txn.Input))
                {
                    programByteCode = txn.Input.HexToByteArray();
                }

                var program = new Program(programByteCode, programContext);
                var evmSimulator = new EVMSimulator();

                // Execute
                var executedProgram = await evmSimulator.ExecuteAsync(program);

                stopwatch.Stop();

                // Map Results
                result.ProgramResult = executedProgram.ProgramResult;
                result.IsRevert = executedProgram.ProgramResult.IsRevert;
                result.ExecutionTimeMs = stopwatch.ElapsedMilliseconds;

                if (result.IsRevert)
                {
                    result.ErrorMessage = executedProgram.ProgramResult.GetRevertMessage();
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                result.SystemException = ex;
                result.ErrorMessage = ex.Message;
                result.ExecutionTimeMs = stopwatch.ElapsedMilliseconds;
            }

            return result;
        }
    }
}