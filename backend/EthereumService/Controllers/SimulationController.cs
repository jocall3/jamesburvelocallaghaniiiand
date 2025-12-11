```csharp
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.EVM;
using Nethereum.EVM.BlockchainState;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using System;
using System.Collections.Generic;
using System.Linq;

namespace EthereumService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulationController : ControllerBase
    {
        /// <summary>
        /// Represents the request to simulate a transaction.
        /// </summary>
        public class SimulateTransactionRequest
        {
            /// <summary>
            /// The hash of the transaction to simulate.
            /// </summary>
            /// <example>0xb9f4e6e5c90329a43da70ced8e8974c3fa34e67e32283bfa82778296fa79dd98</example>
            public string TransactionHash { get; set; }

            /// <summary>
            /// The URL of the Ethereum JSON-RPC node to use for fetching blockchain state.
            /// </summary>
            /// <example>https://mainnet.infura.io/v3/your-infura-api-key</example>
            public string NodeUrl { get; set; }
        }

        /// <summary>
        /// Represents the result of an EVM simulation.
        /// </summary>
        public class SimulationResult
        {
            public bool IsRevert { get; set; }
            public string RevertMessage { get; set; }
            public string ReturnValue { get; set; }
            public List<FilterLog> Logs { get; set; }
            public long GasUsed { get; set; }
            public string Error { get; set; }
        }

        /// <summary>
        /// Simulates a transaction from the blockchain by its hash.
        /// </summary>
        /// <remarks>
        /// This endpoint re-executes a past transaction in the Nethereum EVM simulator.
        /// It fetches the state from the block *before* the transaction was included,
        /// allowing for analysis of its execution, logs, and potential reverts.
        /// </remarks>
        /// <param name="request">The request containing the transaction hash and node URL.</param>
        /// <returns>The result of the simulation.</returns>
        [HttpPost("by-tx-hash")]
        [ProducesResponseType(typeof(SimulationResult), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> SimulateByTransactionHash([FromBody] SimulateTransactionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.TransactionHash) || string.IsNullOrWhiteSpace(request.NodeUrl))
            {
                return BadRequest("TransactionHash and NodeUrl are required.");
            }

            try
            {
                var web3 = new Web3(request.NodeUrl);

                var txn = await web3.Eth.Transactions.GetTransactionByHash.SendRequestAsync(request.TransactionHash);
                if (txn == null)
                {
                    return NotFound($"Transaction with hash '{request.TransactionHash}' not found.");
                }

                if (txn.BlockNumber == null || txn.BlockNumber.Value == 0)
                {
                    return BadRequest("Cannot simulate a pending transaction.");
                }
                
                var block = await web3.Eth.Blocks.GetBlockWithTransactionsHashesByNumber.SendRequestAsync(txn.BlockNumber);
                if (block == null)
                {
                    return NotFound($"Block number '{txn.BlockNumber.Value}' for transaction not found.");
                }
                
                var code = await web3.Eth.GetCode.SendRequestAsync(txn.To);
                
                var program = await ExecuteProgramAsync(web3, txn, block, code);

                var result = new SimulationResult
                {
                    IsRevert = program.ProgramResult.IsRevert,
                    RevertMessage = program.ProgramResult.IsRevert ? program.ProgramResult.GetRevertMessage() : null,
                    ReturnValue = program.ProgramResult.Result?.ToHex(true),
                    Logs = program.ProgramResult.Logs?.Select(l => new FilterLog
                    {
                        Address = l.Address.ToHex(),
                        Data = l.Data.ToHex(),
                        Topics = l.Topics.Select(t => (object)t.ToHex(true)).ToArray()
                    }).ToList(),
                    GasUsed = (long)program.ProgramResult.GasUsed,
                    Error = program.ProgramResult.Exception?.Message
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                // In a real application, you would log the full exception details.
                return StatusCode(500, new SimulationResult { Error = $"An unexpected error occurred: {ex.Message}" });
            }
        }

        private static async Task<Program> ExecuteProgramAsync(IWeb3 web3, Transaction txn, BlockWithTransactionHashes block, string code)
        {
            var txnInput = txn.ConvertToTransactionInput();
            
            // Ensure a chain ID is set for EIP-155 replay protection. Default to MainNet if not present.
            if (txn.ChainId == null || txn.ChainId.Value == 0)
            {
                txnInput.ChainId = new HexBigInteger(1);
            }

            // The state will be read from the block *before* the transaction was included.
            var blockNumberForState = new BlockParameter(new HexBigInteger(txn.BlockNumber.Value - 1));
            var nodeDataService = new RpcNodeDataService(web3.Eth, blockNumberForState);
            var executionStateService = new ExecutionStateService(nodeDataService);

            var programContext = new ProgramContext(
                txnInput, 
                executionStateService, 
                null, 
                null, 
                (long)txn.BlockNumber.Value, 
                (long)block.Timestamp.Value);
            
            var program = new Program(code.HexToByteArray(), programContext);
            var evmSimulator = new EVMSimulator();

            try
            {
                // Execute with tracing disabled for performance as it's not needed for the result.
                program = await evmSimulator.ExecuteAsync(program, 0, 0, false);
                return program;
            }
            catch (Exception ex)
            {
                program.ProgramResult.Exception = ex;
                return program;
            }
        }
    }
}
```