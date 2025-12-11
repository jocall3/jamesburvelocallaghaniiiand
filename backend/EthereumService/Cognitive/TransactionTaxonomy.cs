using System;
using System.Collections.Generic;
using System.Linq;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Nethereum.Cognitive
{
    public enum TransactionTaxonomyType
    {
        Unknown,
        Swap,
        LiquidityProvision,
        LiquidityWithdrawal,
        Governance,
        NFT,
        OracleUpdate,
        Bridge,
        ContractDeployment,
        Internal,
        Arbitrage,
        Liquidation,
        Deposit,
        Withdrawal
    }

    [AttributeUsage(AttributeTargets.Field, AllowMultiple = false)]
    public class TransactionTagAttribute : Attribute
    {
        public TransactionTaxonomyType Type { get; }
        public string[] FunctionSignatures { get; }

        public TransactionTagAttribute(TransactionTaxonomyType type, params string[] functionSignatures)
        {
            Type = type;
            FunctionSignatures = functionSignatures ?? Array.Empty<string>();
        }
    }

    public static class TransactionTaxonomy
    {
        private static readonly Dictionary<string, TransactionTaxonomyType> FunctionSignatureToTypeMap = new Dictionary<string, TransactionTaxonomyType>();
        private static readonly Dictionary<TransactionTaxonomyType, string[]> TypeToFunctionSignaturesMap = new Dictionary<TransactionTaxonomyType, string[]>();

        static TransactionTaxonomy()
        {
            MapAttributes();
        }

        private static void MapAttributes()
        {
            var enumType = typeof(TransactionTaxonomyType);
            foreach (var enumValue in enumType.GetEnumValues().Cast<TransactionTaxonomyType>())
            {
                if (enumValue == TransactionTaxonomyType.Unknown) continue;

                var memberInfo = enumType.GetMember(enumValue.ToString());
                var attributes = memberInfo[0].GetCustomAttributes(typeof(TransactionTagAttribute), false)
                    .Cast<TransactionTagAttribute>()
                    .ToArray();

                if (attributes.Length > 0)
                {
                    var attribute = attributes[0];
                    TypeToFunctionSignaturesMap[enumValue] = attribute.FunctionSignatures;

                    foreach (var signature in attribute.FunctionSignatures)
                    {
                        if (FunctionSignatureToTypeMap.ContainsKey(signature))
                        {
                            throw new InvalidOperationException($"Function signature '{signature}' is already mapped to type {FunctionSignatureToTypeMap[signature]}. Cannot map to {enumValue}.");
                        }
                        FunctionSignatureToTypeMap[signature] = enumValue;
                    }
                }
            }
        }

        [TransactionTag(TransactionTaxonomyType.Swap, "swapExactTokensForTokens(uint256,uint256[],address[],address,uint256)", "swapTokensForExactTokens(uint256,uint256[],address[],address,uint256)", "swapExactETHForTokens(uint256,address[],address,uint256)", "swapTokensForExactETH(uint256,address[],address,uint256)", "swapExactTokensForETH(uint256,address[],address,uint256)", "swapETHForExactTokens(uint256,address[],address,uint256)", "swap(uint256,uint256,address[],address)")]
        private const string SwapTag = "Swap";

        [TransactionTag(TransactionTaxonomyType.LiquidityProvision, "addLiquidity(address,address,uint256,uint256,uint256,address,uint256)", "addLiquidityETH(address,uint256,uint256,uint256,address,uint256)", "addLiquidity(uint256,uint256,address[],uint256)")]
        private const string LiquidityProvisionTag = "LiquidityProvision";

        [TransactionTag(TransactionTaxonomyType.LiquidityWithdrawal, "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)", "removeLiquidityETH(address,uint256,uint256,address,uint256)", "removeLiquidity(uint256,uint256,uint256,address)")]
        private const string LiquidityWithdrawalTag = "LiquidityWithdrawal";

        [TransactionTag(TransactionTaxonomyType.Governance, "vote(uint256[],uint256[])", "delegate(address)", "propose(address[],uint256[],uint256[],string)", "execute(uint256)")]
        private const string GovernanceTag = "Governance";

        [TransactionTag(TransactionTaxonomyType.NFT, "safeTransferFrom(address,address,uint256)", "transferFrom(address,address,uint256)", "approve(address,uint256)", "setApprovalForAll(address,bool)")]
        private const string NftTag = "NFT";

        [TransactionTag(TransactionTaxonomyType.OracleUpdate, "update()", "setMaxPrice(uint256)")]
        private const string OracleTag = "OracleUpdate";

        [TransactionTag(TransactionTaxonomyType.Bridge, "bridgeAssets(address,address,uint256,bytes)", "execute(uint256,address[],uint256[],bytes)")]
        private const string BridgeTag = "Bridge";

        [TransactionTag(TransactionTaxonomyType.ContractDeployment, "deploy(bytes)")]
        private const string ContractDeploymentTag = "ContractDeployment";

        [TransactionTag(TransactionTaxonomyType.Arbitrage, "flashLoan(address,uint256,uint256[],address[],address[],bytes,uint256)")]
        private const string ArbitrageTag = "Arbitrage";

        [TransactionTag(TransactionTaxonomyType.Liquidation, "liquidate(address,uint256)")]
        private const string LiquidationTag = "Liquidation";

        [TransactionTag(TransactionTaxonomyType.Deposit, "deposit(uint256)")]
        private const string DepositTag = "Deposit";

        [TransactionTag(TransactionTaxonomyType.Withdrawal, "withdraw(uint256)")]
        private const string WithdrawalTag = "Withdrawal";


        public static TransactionTaxonomyType ClassifyTransaction(string inputData, string toAddress)
        {
            if (string.IsNullOrEmpty(inputData) || inputData.Length < 10)
            {
                return TransactionTaxonomyType.Unknown;
            }

            var functionSignature = inputData.Substring(0, 10);

            if (FunctionSignatureToTypeMap.TryGetValue(functionSignature, out var type))
            {
                return type;
            }

            return TransactionTaxonomyType.Unknown;
        }

        public static List<TransactionTaxonomyType> GetAllClassifications()
        {
            return Enum.GetValues(typeof(TransactionTaxonomyType)).Cast<TransactionTaxonomyType>().ToList();
        }

        public static string[] GetFunctionSignaturesForType(TransactionTaxonomyType type)
        {
            if (TypeToFunctionSignaturesMap.TryGetValue(type, out var signatures))
            {
                return signatures;
            }
            return Array.Empty<string>();
        }
    }
}