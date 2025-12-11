using System.Collections.Generic;

namespace EthereumService.Models
{
    /// <summary>
    /// Represents the standardized response from a blockchain transaction simulation.
    /// </summary>
    public class SimulationResponse
    {
        /// <summary>
        /// Indicates whether the transaction simulation resulted in a revert.
        /// </summary>
        public bool IsRevert { get; set; }

        /// <summary>
        /// The revert message if the transaction was reverted. Null if the transaction succeeded.
        /// </summary>
        public string RevertMessage { get; set; }

        /// <summary>
        /// The hex-encoded return value of the top-level call.
        /// </summary>
        public string ReturnValue { get; set; }

        /// <summary>
        /// The total amount of gas consumed by the simulation.
        /// </summary>
        public long GasUsed { get; set; }

        /// <summary>
        /// A list of logs emitted during the simulation.
        /// </summary>
        public List<LogEntry> Logs { get; set; }

        /// <summary>
        /// A detailed step-by-step trace of the EVM execution.
        /// This may be null if tracing was not requested or failed.
        /// </summary>
        public List<TraceStep> Trace { get; set; }

        /// <summary>
        /// An error message if the simulation engine itself encountered a problem
        /// (distinct from a transaction revert).
        /// </summary>
        public string ErrorMessage { get; set; }
    }

    /// <summary>
    /// Represents a single log entry (event) emitted by a contract.
    /// </summary>
    public class LogEntry
    {
        /// <summary>
        /// The address of the contract that emitted the log.
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// The list of indexed topics for the log.
        /// </summary>
        public List<string> Topics { get; set; }

        /// <summary>
        /// The non-indexed data payload of the log.
        /// </summary>
        public string Data { get; set; }
    }

    /// <summary>
    /// Represents a single step in the EVM execution trace.
    /// </summary>
    public class TraceStep
    {
        /// <summary>
        /// The program counter.
        /// </summary>
        public int Pc { get; set; }

        /// <summary>
        /// The name of the opcode being executed (e.g., "PUSH1", "ADD").
        /// </summary>
        public string Op { get; set; }

        /// <summary>
        /// The amount of gas available before this step executes.
        /// </summary>
        public long Gas { get; set; }

        /// <summary>
        /// The gas cost of this specific operation.
        /// </summary>
        public long GasCost { get; set; }

        /// <summary>
        /// The call stack depth.
        /// </summary>
        public int Depth { get; set; }

        /// <summary>
        /// The state of the EVM stack before this operation.
        /// </summary>
        public List<string> Stack { get; set; }

        /// <summary>
        /// The state of the EVM memory, represented as a list of 32-byte (64 hex characters) words.
        /// </summary>
        public List<string> Memory { get; set; }

        /// <summary>
        /// An error message if this specific step caused an exception.
        /// </summary>
        public string Error { get; set; }
    }
}