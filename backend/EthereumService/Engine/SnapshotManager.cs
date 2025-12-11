using Nethereum.EVM.BlockchainState;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Backend.EthereumService.Engine
{
    /// <summary>
    /// Provides functionality to efficiently save and restore EVM state snapshots.
    /// This enables rapid branching and state reversion in simulations by managing 
    /// deep copies of the ExecutionStateService's internal account and storage states.
    /// </summary>
    public class SnapshotManager
    {
        private readonly ExecutionStateService _executionStateService;
        private readonly Dictionary<string, Dictionary<string, AccountExecutionState>> _snapshots;
        private readonly FieldInfo _accountsStateField;

        public SnapshotManager(ExecutionStateService executionStateService)
        {
            _executionStateService = executionStateService ?? throw new ArgumentNullException(nameof(executionStateService));
            _snapshots = new Dictionary<string, Dictionary<string, AccountExecutionState>>();

            // Locate the internal state dictionary within ExecutionStateService using Reflection.
            // This is necessary to perform a full state swap efficiently.
            var type = typeof(ExecutionStateService);
            _accountsStateField = type.GetField("_accountsState", BindingFlags.NonPublic | BindingFlags.Instance);

            if (_accountsStateField == null)
            {
                // Fallback: check for backing field if implemented as an auto-property
                _accountsStateField = type.GetField("<AccountsState>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            }

            if (_accountsStateField == null)
            {
                throw new InvalidOperationException("SnapshotManager failed to access the internal '_accountsState' of ExecutionStateService.");
            }
        }

        /// <summary>
        /// Captures the current state of all tracked accounts and their storage.
        /// </summary>
        /// <returns>A unique identifier for the created snapshot.</returns>
        public string TakeSnapshot()
        {
            var snapshotId = Guid.NewGuid().ToString("N");
            var currentState = GetCurrentAccountsState();

            // Perform a deep clone to isolate the snapshot from subsequent state changes
            var clonedState = DeepCloneState(currentState);

            _snapshots[snapshotId] = clonedState;
            return snapshotId;
        }

        /// <summary>
        /// Restores the ExecutionStateService to the state recorded in the specified snapshot.
        /// </summary>
        /// <param name="snapshotId">The ID of the snapshot to restore.</param>
        public void RevertToSnapshot(string snapshotId)
        {
            if (!_snapshots.TryGetValue(snapshotId, out var snapshotState))
            {
                throw new ArgumentException($"Snapshot with ID {snapshotId} not found.", nameof(snapshotId));
            }

            // Deep clone from the snapshot back to a new active state instance.
            // This ensures the stored snapshot remains pristine for future reverts.
            var restoredState = DeepCloneState(snapshotState);

            // ExecutionStateService typically uses ConcurrentDictionary for thread safety.
            var concurrentState = new ConcurrentDictionary<string, AccountExecutionState>(restoredState);

            // Inject the restored state back into the service
            _accountsStateField.SetValue(_executionStateService, concurrentState);
        }

        /// <summary>
        /// Removes a snapshot from memory to free resources.
        /// </summary>
        /// <param name="snapshotId">The ID of the snapshot to discard.</param>
        public void DiscardSnapshot(string snapshotId)
        {
            if (_snapshots.ContainsKey(snapshotId))
            {
                _snapshots.Remove(snapshotId);
            }
        }

        /// <summary>
        /// Clears all managed snapshots.
        /// </summary>
        public void ClearAllSnapshots()
        {
            _snapshots.Clear();
        }

        private IDictionary<string, AccountExecutionState> GetCurrentAccountsState()
        {
            return _accountsStateField.GetValue(_executionStateService) as IDictionary<string, AccountExecutionState>;
        }

        private Dictionary<string, AccountExecutionState> DeepCloneState(IDictionary<string, AccountExecutionState> source)
        {
            if (source == null) return new Dictionary<string, AccountExecutionState>();

            var clone = new Dictionary<string, AccountExecutionState>(source.Count);
            foreach (var kvp in source)
            {
                var originalAccount = kvp.Value;

                // Create a new AccountExecutionState instance with copied properties.
                // Note: We copy the Byte Arrays (Code) to prevent reference sharing.
                var newAccount = new AccountExecutionState(
                    originalAccount.Address,
                    originalAccount.Nonce,
                    originalAccount.Balance,
                    originalAccount.Code?.ToArray()
                );

                // Deep copy the storage dictionary
                if (originalAccount.Storage != null)
                {
                    foreach (var storageItem in originalAccount.Storage)
                    {
                        var key = storageItem.Key;
                        var val = storageItem.Value?.ToArray(); // Clone the byte array value
                        newAccount.UpsertStorageValue(key, val);
                    }
                }

                clone[kvp.Key] = newAccount;
            }

            return clone;
        }
    }
}