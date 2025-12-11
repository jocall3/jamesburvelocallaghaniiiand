using Nethereum.EVM;
using Nethereum.EVM.BlockchainState;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Util;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;

namespace Nethereum.EthereumService.Engine
{
    /// <summary>
    /// Defines the type of EVM call.
    /// </summary>
    public enum EvmCallType
    {
        CALL,
        CALLCODE,
        DELEGATECALL,
        STATICCALL,
        CREATE,
        CREATE2
    }

    /// <summary>
    /// Represents an internal call within an EVM transaction trace.
    /// </summary>
    public class EvmInternalCall
    {
        /// <summary>
        /// The index of the trace step where this internal call was initiated.
        /// </summary>
        public int TraceStepIndex { get; set; }

        /// <summary>
        /// The call depth of this internal call (0 for top-level, 1 for first internal call, etc.).
        /// </summary>
        public int Depth { get; set; }

        /// <summary>
        /// The address of the caller contract/account.
        /// </summary>
        public string From { get; set; }

        /// <summary>
        /// The address of the callee contract/account. For CREATE/CREATE2, this is the address of the newly created contract.
        /// </summary>
        public string To { get; set; }

        /// <summary>
        /// The Ether value transferred with this call.
        /// </summary>
        public BigInteger Value { get; set; }

        /// <summary>
        /// The input data (calldata) for the call.
        /// </summary>
        public byte[] Input { get; set; }

        /// <summary>
        /// The output data returned by the call.
        /// </summary>
        public byte[] Output { get; set; }

        /// <summary>
        /// The gas limit provided for this call.
        /// </summary>
        public BigInteger GasLimit { get; set; }

        /// <summary>
        /// The actual gas used by this call.
        /// </summary>
        public BigInteger GasUsed { get; set; }

        /// <summary>
        /// The type of EVM call (CALL, DELEGATECALL, STATICCALL, CALLCODE, CREATE, CREATE2).
        /// </summary>
        public EvmCallType Type { get; set; }

        /// <summary>
        /// Indicates if the internal call executed successfully.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// The revert reason message if the call reverted.
        /// </summary>
        public string RevertReason { get; set; }
    }

    /// <summary>
    /// Represents a storage modification (SSTORE) within an EVM transaction trace.
    /// </summary>
    public class EvmStorageChange
    {
        /// <summary>
        /// The index of the trace step where this storage change occurred.
        /// </summary>
        public int TraceStepIndex { get; set; }

        /// <summary>
        /// The address of the contract whose storage was modified.
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// The storage slot key.
        /// </summary>
        public BigInteger Key { get; set; }

        /// <summary>
        /// The value in the storage slot before the modification.
        /// </summary>
        public byte[] OldValue { get; set; }

        /// <summary>
        /// The value in the storage slot after the modification.
        /// </summary>
        public byte[] NewValue { get; set; }
    }

    /// <summary>
    /// Represents a log event (LOG0-LOG4) emitted within an EVM transaction trace.
    /// </summary>
    public class EvmLogEvent
    {
        /// <summary>
        /// The index of the trace step where this log event was emitted.
        /// </summary>
        public int TraceStepIndex { get; set; }

        /// <summary>
        /// The address of the contract that emitted the log.
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// The list of topics associated with the log.
        /// </summary>
        public List<string> Topics { get; set; }

        /// <summary>
        /// The data payload of the log.
        /// </summary>
        public string Data { get; set; }
    }

    /// <summary>
    /// Encapsulates the aggregated results of an EVM trace analysis.
    /// </summary>
    public class TraceAnalysisResult
    {
        /// <summary>
        /// A list of all internal calls detected in the trace.
        /// </summary>
        public List<EvmInternalCall> InternalCalls { get; set; } = new List<EvmInternalCall>();

        /// <summary>
        /// A list of all storage modifications detected in the trace.
        /// </summary>
        public List<EvmStorageChange> StorageChanges { get; set; } = new List<EvmStorageChange>();

        /// <summary>
        /// A list of all log events emitted in the trace.
        /// </summary>
        public List<EvmLogEvent> LogEvents { get; set; } = new List<EvmLogEvent>();

        /// <summary>
        /// Indicates if the top-level transaction reverted.
        /// </summary>
        public bool IsReverted { get; set; }

        /// <summary>
        /// The revert reason message for the top-level transaction, if it reverted.
        /// </summary>
        public string TopLevelRevertReason { get; set; }

        /// <summary>
        /// The total gas used by the entire transaction.
        /// </summary>
        public BigInteger TotalGasUsed { get; set; }
    }

    /// <summary>
    /// Provides advanced logic to traverse raw EVM execution traces and extract meaningful patterns
    /// like internal calls, storage modifications, and log events.
    /// </summary>
    public class TraceAnalyzer
    {
        private readonly ProgramTrace _programTrace;
        private readonly ExecutionStateService _executionStateService; // Kept for potential future use or context.

        public TraceAnalyzer(ProgramTrace programTrace, ExecutionStateService executionStateService)
        {
            _programTrace = programTrace ?? throw new ArgumentNullException(nameof(programTrace));
            _executionStateService = executionStateService ?? throw new ArgumentNullException(nameof(executionStateService));
        }

        /// <summary>
        /// Analyzes the provided EVM program trace to extract structured information.
        /// </summary>
        /// <returns>A <see cref="TraceAnalysisResult"/> containing lists of internal calls, storage changes, and log events.</returns>
        public TraceAnalysisResult Analyze()
        {
            var result = new TraceAnalysisResult();

            for (int i = 0; i < _programTrace.Count; i++)
            {
                var step = _programTrace[i];
                var opCode = step.Instruction.Instruction;
                
                // Address of the contract whose code is currently being executed
                var currentExecutionAddress = step.ProgramContext?.Address?.ConvertToString(false);

                // Extract Storage Changes
                if (step.StorageChanges != null && step.StorageChanges.Any())
                {
                    foreach (var change in step.StorageChanges)
                    {
                        result.StorageChanges.Add(new EvmStorageChange
                        {
                            TraceStepIndex = i,
                            Address = currentExecutionAddress,
                            Key = change.Key,
                            OldValue = change.OriginalValue,
                            NewValue = change.NewValue
                        });
                    }
                }

                // Extract Log Events
                if (step.Logs != null && step.Logs.Any())
                {
                    foreach (var log in step.Logs)
                    {
                        result.LogEvents.Add(new EvmLogEvent
                        {
                            TraceStepIndex = i,
                            Address = log.Address,
                            Topics = log.Topics?.Select(t => t.ToHex()).ToList(),
                            Data = log.Data
                        });
                    }
                }

                // Extract Internal Calls
                // Nethereum's ProgramTraceStep.InternalCalls contains a ProgramResult for each *initiated* sub-call.
                // The `Depth` property on the `ProgramResult.Context` will reflect the new call's depth.
                if (step.InternalCalls != null && step.InternalCalls.Any())
                {
                    foreach (var internalProgramResult in step.InternalCalls)
                    {
                        EvmCallType callType;
                        switch (opCode)
                        {
                            case Nethereum.EVM.OpCode.CALL: callType = EvmCallType.CALL; break;
                            case Nethereum.EVM.OpCode.CALLCODE: callType = EvmCallType.CALLCODE; break;
                            case Nethereum.EVM.OpCode.DELEGATECALL: callType = EvmCallType.DELEGATECALL; break;
                            case Nethereum.EVM.OpCode.STATICCALL: callType = EvmCallType.STATICCALL; break;
                            case Nethereum.EVM.OpCode.CREATE: callType = EvmCallType.CREATE; break;
                            case Nethereum.EVM.OpCode.CREATE2: callType = EvmCallType.CREATE2; break;
                            default: continue; // If an opcode other than a call-type leads to InternalCalls, it's unexpected, skip.
                        }

                        var internalCall = new EvmInternalCall
                        {
                            TraceStepIndex = i,
                            Depth = internalProgramResult.Context.Depth,
                            From = internalProgramResult.Sender.ConvertToString(false),
                            To = internalProgramResult.Context.Address.ConvertToString(false),
                            Value = internalProgramResult.Context.CallValue,
                            Input = internalProgramResult.Context.Data,
                            Output = internalProgramResult.ReturnData, 
                            GasLimit = internalProgramResult.Context.CallGasLimit, 
                            GasUsed = internalProgramResult.GasUsed,
                            Type = callType,
                            Success = !internalProgramResult.IsRevert,
                            RevertReason = internalProgramResult.GetRevertMessage()
                        };
                        result.InternalCalls.Add(internalCall);
                    }
                }
            }

            // Capture the overall transaction result from the top-level Program object
            if (_programTrace.Program?.ProgramResult != null)
            {
            
                result.IsReverted = _programTrace.Program.ProgramResult.IsRevert;
                result.TopLevelRevertReason = _programTrace.Program.ProgramResult.GetRevertMessage();
                result.TotalGasUsed = _programTrace.Program.ProgramResult.GasUsed;
            }

            return result;
        }
    }
}