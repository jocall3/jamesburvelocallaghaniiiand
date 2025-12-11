using Nethereum.EVM.BlockchainState;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using System.Numerics;

namespace Nethereum.Contracts.IntegrationTests.EVM
{
    /// <summary>
    /// Provides methods to override and configure the blockchain state (balances, storage, nonce, code)
    /// for specific accounts within an <see cref="ExecutionStateService"/>.
    /// This is useful for setting up "what-if" scenarios for EVM simulations.
    /// </summary>
    public static class StateOverrider
    {
        /// <summary>
        /// Upserts a storage value for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose storage is to be updated.</param>
        /// <param name="slotKey">The storage slot key (e.g., hash of the storage variable name or index).</param>
        /// <param name="slotValue">The value to set for the storage slot, as a byte array.</param>
        public static void UpsertAccountStorage(this ExecutionStateService executionStateService, string accountAddress, BigInteger slotKey, byte[] slotValue)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.UpsertStorageValue(slotKey, slotValue);
        }

        /// <summary>
        /// Upserts a storage value for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// The slot key is provided as a hexadecimal string.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose storage is to be updated.</param>
        /// <param name="slotKeyHex">The storage slot key as a hexadecimal string.</param>
        /// <param name="slotValue">The value to set for the storage slot, as a byte array.</param>
        public static void UpsertAccountStorage(this ExecutionStateService executionStateService, string accountAddress, string slotKeyHex, byte[] slotValue)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.UpsertStorageValue(slotKeyHex.HexToBigInteger(false), slotValue);
        }

        /// <summary>
        /// Upserts a storage value for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// The slot value is provided as a hexadecimal string.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose storage is to be updated.</param>
        /// <param name="slotKey">The storage slot key (e.g., hash of the storage variable name or index).</param>
        /// <param name="slotValueHex">The value to set for the storage slot, as a hexadecimal string.</param>
        public static void UpsertAccountStorage(this ExecutionStateService executionStateService, string accountAddress, BigInteger slotKey, string slotValueHex)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.UpsertStorageValue(slotKey, slotValueHex.HexToByteArray());
        }

        /// <summary>
        /// Upserts a storage value for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// Both slot key and slot value are provided as hexadecimal strings.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose storage is to be updated.</param>
        /// <param name="slotKeyHex">The storage slot key as a hexadecimal string.</param>
        /// <param name="slotValueHex">The value to set for the storage slot, as a hexadecimal string.</param>
        public static void UpsertAccountStorage(this ExecutionStateService executionStateService, string accountAddress, string slotKeyHex, string slotValueHex)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.UpsertStorageValue(slotKeyHex.HexToBigInteger(false), slotValueHex.HexToByteArray());
        }


        /// <summary>
        /// Sets the balance for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose balance is to be set.</param>
        /// <param name="balance">The balance to set for the account.</param>
        public static void SetAccountBalance(this ExecutionStateService executionStateService, string accountAddress, BigInteger balance)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetBalance(balance);
        }

        /// <summary>
        /// Sets the balance for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// The balance is provided as a hexadecimal string.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose balance is to be set.</param>
        /// <param name="balanceHex">The balance to set for the account, as a hexadecimal string.</param>
        public static void SetAccountBalance(this ExecutionStateService executionStateService, string accountAddress, string balanceHex)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetBalance(balanceHex.HexToBigInteger(false));
        }

        /// <summary>
        /// Sets the nonce for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose nonce is to be set.</param>
        /// <param name="nonce">The nonce to set for the account.</param>
        public static void SetAccountNonce(this ExecutionStateService executionStateService, string accountAddress, BigInteger nonce)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetNonce(nonce);
        }

        /// <summary>
        /// Sets the code for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose code is to be set.</param>
        /// <param name="code">The bytecode to set for the account.</param>
        public static void SetAccountCode(this ExecutionStateService executionStateService, string accountAddress, byte[] code)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetCode(code);
        }

        /// <summary>
        /// Sets the code for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// The code is provided as a hexadecimal string.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose code is to be set.</param>
        /// <param name="codeHex">The bytecode to set for the account, as a hexadecimal string.</param>
        public static void SetAccountCode(this ExecutionStateService executionStateService, string accountAddress, string codeHex)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetCode(codeHex.HexToByteArray());
        }

        /// <summary>
        /// Sets the code for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// The code is provided as a hexadecimal string.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose code is to be set.</param>
        /// <param name="codeHash">The hash of the bytecode to set for the account.</param>
        public static void SetAccountCodeHash(this ExecutionStateService executionStateService, string accountAddress, byte[] codeHash)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetCodeHash(codeHash);
        }

        /// <summary>
        /// Sets the code for a given account. If the account doesn't exist in the
        /// <see cref="ExecutionStateService"/>, it will be created.
        /// The code is provided as a hexadecimal string.
        /// </summary>
        /// <param name="executionStateService">The execution state service to modify.</param>
        /// <param name="accountAddress">The address of the account whose code is to be set.</param>
        /// <param name="codeHashHex">The hash of the bytecode to set for the account, as a hexadecimal string.</param>
        public static void SetAccountCodeHash(this ExecutionStateService executionStateService, string accountAddress, string codeHashHex)
        {
            var accountState = executionStateService.CreateOrGetAccountExecutionState(accountAddress);
            accountState.SetCodeHash(codeHashHex.HexToByteArray());
        }
    }
}