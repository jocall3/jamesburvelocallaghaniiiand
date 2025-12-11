using Nethereum.ABI;
using Nethereum.ABI.Decoders;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using Nethereum.Model.Enums;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Util;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;

namespace Nethereum.Contracts.Cognitive
{
    public class ProtocolIdentifier
    {
        private readonly Dictionary<string, ProtocolDetails> _knownProtocols = new Dictionary<string, ProtocolDetails>(StringComparer.OrdinalIgnoreCase);

        public ProtocolIdentifier()
        {
            // Uniswap V2 Factory (Example Addresses - real addresses should be loaded from a configuration or deployment helper)
            RegisterProtocol("Uniswap V2 Factory", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", ProtocolType.DEX, "Uniswap", "V2");

            // Uniswap V3 Factory
            RegisterProtocol("Uniswap V3 Factory", "0x1F9840585D58fFb1a9218F9Ee1D1B011eD73fF8e", ProtocolType.DEX, "Uniswap", "V3");

            // Curve Factory (Example for a typical factory)
            // Note: Curve factories are complex, this is a placeholder for a known Router/Gateway if needed for heuristics
            RegisterProtocol("Curve V1 Factory", "0x0000000000000000000000000000000000000000", ProtocolType.DEX, "Curve", "V1");

            // Aave V2 Lending Pool (Example)
            RegisterProtocol("Aave V2 Lending Pool", "0x801a72a53ea02ce25ba43ba1a72b3902829ab61c", ProtocolType.Lending, "Aave", "V2");

            // Common Router/Gateway Addresses (Used heavily in transactions)
            // Uniswap V2 Router 02
            RegisterProtocol("Uniswap V2 Router 02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", ProtocolType.DEX, "Uniswap", "V2");
            
            // Uniswap V3 Router (Exact Input)
            RegisterProtocol("Uniswap V3 Router", "0xE592427A0AEce92De3Edee1F18F0157C05861564", ProtocolType.DEX, "Uniswap", "V3");

            // Curve Router (Example)
            RegisterProtocol("Curve Router", "0x7a16f5A35b23353B5A1aA9922aB2b023ba2379a3", ProtocolType.DEX, "Curve", "Router");
        }

        private void RegisterProtocol(string name, string address, ProtocolType type, string protocol, string version)
        {
            if (!address.StartsWith("0x"))
            {
                address = "0x" + address;
            }
            _knownProtocols[address.ToLower()] = new ProtocolDetails
            {
                Name = name,
                Type = type,
                Protocol = protocol,
                Version = version
            };
        }

        public ProtocolDetails IdentifyProtocol(string address)
        {
            if (string.IsNullOrEmpty(address)) return null;
            _knownProtocols.TryGetValue(address.ToLower(), out var details);
            return details;
        }

        /// <summary>
        /// Heuristically identifies the protocol based on transaction input data and contract interactions.
        /// This function is intended for transactions where the contract address itself isn't explicitly known,
        /// or to confirm interactions with known addresses.
        /// </summary>
        public async Task<ProtocolDetails> IdentifyProtocolHeuristicallyAsync(TransactionInput transactionInput, string contractCode)
        {
            if (transactionInput == null) return null;

            var toAddress = transactionInput.To?.ToLower();
            if (string.IsNullOrEmpty(toAddress)) return null;

            // 1. Check against known addresses first
            var knownDetails = IdentifyProtocol(toAddress);
            if (knownDetails != null)
            {
                return knownDetails;
            }

            // 2. Heuristics based on Input Data (Function Signature)
            if (transactionInput.Data != null && transactionInput.Data.Length >= 10)
            {
                var signature = transactionInput.Data.Substring(0, 10).ToLower();
                
                // --- Uniswap/DEX Heuristics ---
                // swapExactETHForTokens, swapExactTokensForTokens, swapExactTokensForETH
                if (new[] { "0x38ed17ea", "0x7ff36aa5", "0x1861fc6c" }.Contains(signature))
                {
                    return new ProtocolDetails { Protocol = "Uniswap", Version = "V2/V3", Type = ProtocolType.DEX };
                }
                // V3 specific methods (e.g., swap call on a pool)
                if (new[] { "0xddf252ad", "0x5ae160a3" }.Contains(signature)) // Transfer/Permit might indicate underlying pool interaction, but less reliable for factory identification
                {
                    // If it's a transfer, we check the code next time, but for now, assume DEX interaction if the code is a pool
                }

                // --- Curve Heuristics ---
                // add_liquidity, remove_liquidity, exchange
                if (new[] { "0xf1778337", "0x41f8829d", "0x12210e2f" }.Contains(signature))
                {
                    return new ProtocolDetails { Protocol = "Curve", Version = "V1/V2", Type = ProtocolType.DEX };
                }

                // --- Aave Heuristics ---
                // deposit, withdraw, borrow
                if (new[] { "0xd0e30db0", "0x2b08a16a", "0x19ea338b" }.Contains(signature))
                {
                    return new ProtocolDetails { Protocol = "Aave", Version = "V2/V3", Type = ProtocolType.Lending };
                }
            }

            // 3. Heuristics based on Contract Code (If contractCode is provided, usually from GetCode)
            if (!string.IsNullOrEmpty(contractCode) && contractCode.Length > 4)
            {
                var codeBytes = contractCode.HexToByteArray();

                // Simple check for common deployment signatures or code structures (very weak heuristic but better than nothing)
                // For complex protocols like Curve/Uniswap V3, deterministic deployment patterns or specific creation codes are usually required,
                // which is hard without knowing deployment blocks.

                if (codeBytes.Length > 1000) // Contracts larger than typical simple proxies often indicate factories or complex routers
                {
                    // Check for Uniswap V2 Factory signature (Constructor arguments might reveal it, but only bytecode is available here)
                    // This is highly unreliable without deployment context. We stick to known addresses for reliable results.
                }
            }


            return null;
        }
    }

    public class ProtocolDetails
    {
        public string Name { get; set; }
        public string Protocol { get; set; }
        public string Version { get; set; }
        public ProtocolType Type { get; set; }
    }

    public enum ProtocolType
    {
        DEX,
        Lending,
        Vault,
        YieldAggregator,
        Unknown
    }
}