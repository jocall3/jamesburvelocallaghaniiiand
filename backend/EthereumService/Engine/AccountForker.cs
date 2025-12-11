using Nethereum.EVM.BlockchainState;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Web3;
using System.Threading.Tasks;
using Nethereum.Hex.HexConvertors.Extensions;
using System.Collections.Generic;
using System.Numerics;
using Nethereum.RPC.DebugNode;
using Nethereum.Contracts.Constants; // For AddressConstants.EmptyAddress

namespace Nethereum.EVM
{
    /// <summary>
    /// Manages the logic for forking account states from the mainnet to the local simulation sandbox efficiently.
    /// This service fetches account's balance, nonce, code, and optionally storage at a specific block number
    /// from a connected Ethereum client and applies it to an <see cref="ExecutionStateService"/>.
    /// </summary>
    public class AccountForker
    {
        private readonly IWeb3 _web3;
        private readonly BlockParameter _blockParameter;
        private readonly IEthDebugApiService _ethDebugService;

        /// <summary>
        /// Initializes a new instance of the <see cref="AccountForker"/> class.
        /// </summary>
        /// <param name="web3">The Web3 instance to interact with the Ethereum network (e.g., Infura).</param>
        /// <param name="blockParameter">The block parameter specifying the block from which to fork the state.</param>
        /// <param name="ethDebugService">Optional. The Nethereum debug API service. If provided, it enables efficient storage retrieval using `debug_storageAt`.</param>
        public AccountForker(IWeb3 web3, BlockParameter blockParameter, IEthDebugApiService ethDebugService = null)
        {
            _web3 = web3;
            _blockParameter = blockParameter;
            _ethDebugService = ethDebugService;
        }

        /// <summary>
        /// Forks the state of a single account from the blockchain into the provided <see cref="ExecutionStateService"/>.
        /// This method fetches the account's balance, nonce, and code.
        /// Storage will be fetched efficiently using `debug_storageAt` if an <see cref="IEthDebugApiService"/>
        /// was provided in the constructor and `includeStorage` is true.
        /// </summary>
        /// <param name="address">The address of the account to fork.</param>
        /// <param name="executionStateService">The <see cref="ExecutionStateService"/> instance to populate with the forked account state.</param>
        /// <param name="includeStorage">Whether to include storage slots in the forked state. Comprehensive storage forking requires an archive node and `debug_storageAt` functionality.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task ForkAccountAsync(string address, ExecutionStateService executionStateService, bool includeStorage = true)
        {
            // Skip forking for the empty address as it's a special case and typically not a real account to fork.
            if (string.IsNullOrEmpty(address) || address.IsTheSameHex(AddressConstants.EmptyAddress))
            {
                // Ensure an empty account state is created for consistency if needed by the EVM.
                executionStateService.CreateOrGetAccountExecutionState(address);
                return;
            }

            var accountState = executionStateService.CreateOrGetAccountExecutionState(address);

            // Get Balance
            var balance = await _web3.Eth.Transactions.GetBalance.SendRequestAsync(address, _blockParameter).ConfigureAwait(false);
            accountState.SetBalance(balance.Value);

            // Get Nonce
            var nonce = await _web3.Eth.Transactions.GetTransactionCount.SendRequestAsync(address, _blockParameter).ConfigureAwait(false);
            accountState.SetNonce(nonce.Value);

            // Get Code
            var code = await _web3.Eth.GetCode.SendRequestAsync(address, _blockParameter).ConfigureAwait(false);
            if (!string.IsNullOrEmpty(code) && code != "0x")
            {
                accountState.SetCode(code.HexToByteArray());
            }
            else
            {
                accountState.SetCode(new byte[0]); // Ensure code is an empty byte array if no code exists
            }

            if (includeStorage)
            {
                await LoadStorageAsync(address, accountState).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Loads the storage for a given account into its <see cref="AccountExecutionState"/>.
        /// This method uses `debug_storageAt` if <see cref="IEthDebugApiService"/> is available.
        /// If not, comprehensive storage forking is not possible through this utility.
        /// </summary>
        /// <param name="address">The address of the account.</param>
        /// <param name="accountState">The <see cref="AccountExecutionState"/> to populate with storage.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        private async Task LoadStorageAsync(string address, AccountExecutionState accountState)
        {
            if (_ethDebugService != null)
            {
                // Use debug_storageAt for efficient retrieval of all storage slots for a contract.
                // Nethereum's IEthDebugApiService.StorageAt takes BlockParameter and address.
                var storageData = await _ethDebugService.StorageAt.SendRequestAsync(_blockParameter, address).ConfigureAwait(false);

                if (storageData != null)
                {
                    foreach (var entry in storageData)
                    {
                        var key = entry.Key.HexToBigInteger();
                        var value = entry.Value.HexToByteArray();
                        accountState.UpsertStorageValue(key, value);
                    }
                }
            }
            // If _ethDebugService is null, we cannot efficiently fork all storage for an account.
            // In such cases, specific storage slots would need to be manually configured if required for simulation.
        }
    }
}