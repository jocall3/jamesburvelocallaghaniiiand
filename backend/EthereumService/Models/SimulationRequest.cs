using System.Collections.Generic;
using Newtonsoft.Json;

namespace EthereumService.Models
{
    /// <summary>
    /// Represents a request to simulate an Ethereum transaction.
    /// This DTO is used to receive simulation parameters from an API client.
    /// </summary>
    public class SimulationRequest
    {
        /// <summary>
        /// The hash of the transaction to be simulated.
        /// This is a required field.
        /// Example: "0xb9f4e6e5c90329a43da70ced8e8974c3fa34e67e32283bfa82778296fa79dd98"
        /// </summary>
        [JsonProperty("transactionHash")]
        public string TransactionHash { get; set; }

        /// <summary>
        /// The block number context for the simulation.
        /// If null, the simulation will run against the state of the block immediately preceding the one
        /// where the transaction was mined.
        /// </summary>
        [JsonProperty("blockNumber")]
        public long? BlockNumber { get; set; }

        /// <summary>
        /// Optional state overrides to apply to the blockchain state before simulation.
        /// The key is the Ethereum address (string) of the account to override.
        /// This allows for "what-if" scenarios without altering the actual blockchain.
        /// </summary>
        [JsonProperty("stateOverrides")]
        public Dictionary<string, AccountStateOverride> StateOverrides { get; set; }
    }

    /// <summary>
    /// Defines the state modifications for a single Ethereum account.
    /// Any property left null will not be overridden.
    /// </summary>
    public class AccountStateOverride
    {
        /// <summary>
        /// The balance in wei to set for the account.
        /// Should be provided as a hexadecimal string (e.g., "0x100").
        /// </summary>
        [JsonProperty("balance")]
        public string Balance { get; set; }

        /// <summary>
        /// The nonce to set for the account.
        /// </summary>
        [JsonProperty("nonce")]
        public ulong? Nonce { get; set; }

        /// <summary>
        /// The contract bytecode to set for the account.
        /// Should be provided as a hexadecimal string.
        /// </summary>
        [JsonProperty("code")]
        public string Code { get; set; }

        /// <summary>
        /// A dictionary of storage slots to their values.
        /// Both the key (storage slot) and value are 32-byte hexadecimal strings.
        /// Example: { "0x00...00": "0x00...01" }
        /// </summary>
        [JsonProperty("storage")]
        public Dictionary<string, string> Storage { get; set; }
    }
}