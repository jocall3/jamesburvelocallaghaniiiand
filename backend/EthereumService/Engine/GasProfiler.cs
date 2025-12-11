using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using Nethereum.EVM; // For Nethereum.EVM.OpCode and Instruction

namespace Nethereum.EthereumService.Engine
{
    /// <summary>
    /// A diagnostic tool within the EVM engine that calculates precise gas costs per opcode
    /// to identify optimization opportunities or anomalies.
    /// </summary>
    public class GasProfiler
    {
        private readonly Dictionary<OpCode, BigInteger> _opcodeTotalGasCosts;
        private readonly Dictionary<OpCode, int> _opcodeExecutionCounts;

        public GasProfiler()
        {
            _opcodeTotalGasCosts = new Dictionary<OpCode, BigInteger>();
            _opcodeExecutionCounts = new Dictionary<OpCode, int>();
        }

        /// <summary>
        /// Records the gas cost for a specific opcode execution.
        /// </summary>
        /// <param name="instruction">The EVM instruction executed.</param>
        /// <param name="gasCost">The gas consumed by this execution of the instruction.</param>
        public void RecordGasCost(Instruction instruction, BigInteger gasCost)
        {
            if (instruction == null)
            {
                // In a real scenario, you might want to log an error or throw an ArgumentNullException.
                // For a profiler, silently ignoring might be acceptable depending on robustness requirements.
                return;
            }

            OpCode opcode = instruction.Instruction;

            if (_opcodeTotalGasCosts.ContainsKey(opcode))
            {
                _opcodeTotalGasCosts[opcode] += gasCost;
                _opcodeExecutionCounts[opcode]++;
            }
            else
            {
                _opcodeTotalGasCosts[opcode] = gasCost;
                _opcodeExecutionCounts[opcode] = 1;
            }
        }

        /// <summary>
        /// Gets the total gas cost accumulated for a specific opcode.
        /// </summary>
        /// <param name="opcode">The EVM opcode.</param>
        /// <returns>The total gas cost for the opcode, or zero if not executed.</returns>
        public BigInteger GetTotalGasCost(OpCode opcode)
        {
            return _opcodeTotalGasCosts.TryGetValue(opcode, out var totalCost) ? totalCost : BigInteger.Zero;
        }

        /// <summary>
        /// Gets the number of times a specific opcode was executed.
        /// </summary>
        /// <param name="opcode">The EVM opcode.</param>
        /// <returns>The execution count for the opcode, or zero if not executed.</returns>
        public int GetExecutionCount(OpCode opcode)
        {
            return _opcodeExecutionCounts.TryGetValue(opcode, out var count) ? count : 0;
        }

        /// <summary>
        /// Generates a report of all recorded opcode gas costs and execution counts.
        /// </summary>
        /// <returns>A dictionary where keys are opcodes and values are tuples containing total gas cost and execution count.</returns>
        public Dictionary<OpCode, (BigInteger TotalGasCost, int ExecutionCount)> GetReport()
        {
            return _opcodeTotalGasCosts.ToDictionary(
                kvp => kvp.Key,
                kvp => (kvp.Value, _opcodeExecutionCounts.TryGetValue(kvp.Key, out var count) ? count : 0)
            );
        }

        /// <summary>
        /// Resets all recorded gas costs and execution counts.
        /// </summary>
        public void Reset()
        {
            _opcodeTotalGasCosts.Clear();
            _opcodeExecutionCounts.Clear();
        }
    }
}