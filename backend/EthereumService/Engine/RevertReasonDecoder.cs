using Nethereum.ABI.Decoders;
using Nethereum.Hex.HexConvertors.Extensions;
using System;
using System.Linq;
using System.Text;

namespace Nethereum.EthereumService.Engine
{
    /// <summary>
    /// A utility class for decoding Solidity revert messages and custom error data from transaction return data.
    /// </summary>
    public class RevertReasonDecoder
    {
        /// <summary>
        /// The 4-byte selector for the standard Solidity `Error(string)` revert reason.
        /// This is keccak256("Error(string)") sliced to the first 4 bytes.
        /// </summary>
        public static readonly string StandardRevertErrorSelector = "0x08c379a0";

        private static readonly StringDecoder _stringDecoder = new StringDecoder();

        /// <summary>
        /// Represents a decoded revert reason, which can be a standard Solidity `Error(string)`,
        /// a custom error, or an empty revert.
        /// </summary>
        public class RevertReason
        {
            /// <summary>
            /// Gets a value indicating whether the revert reason is a standard Solidity `Error(string)`.
            /// </summary>
            public bool IsStandardRevert { get; internal set; }

            /// <summary>
            /// Gets the decoded string message if it's a standard Solidity `Error(string)`.
            /// Null otherwise, or if decoding failed even though the selector matched.
            /// </summary>
            public string DecodedMessage { get; internal set; }

            /// <summary>
            /// Gets a value indicating whether the revert reason is a custom Solidity error.
            /// This is true if the return data is at least 4 bytes and doesn't match the standard Error(string) selector.
            /// </summary>
            public bool IsCustomError { get; internal set; }

            /// <summary>
            /// Gets the 4-byte selector for a custom error, as a hex string.
            /// Null if not a custom error.
            /// </summary>
            public string CustomErrorSelector { get; internal set; }

            /// <summary>
            /// Gets the raw encoded parameters (after the selector) for a custom error, as a hex string.
            /// Null if not a custom error.
            /// </summary>
            public string CustomErrorData { get; internal set; }

            /// <summary>
            /// Gets a value indicating whether the revert was an empty revert (e.g., REVERT opcode called with no data,
            /// or data too short to contain a selector).
            /// </summary>
            public bool IsEmptyRevert { get; internal set; }

            /// <summary>
            /// Gets the original raw return data as a hex string.
            /// </summary>
            public string RawReturnData { get; internal set; }
        }

        /// <summary>
        /// Decodes raw transaction return data (e.g., from a failed EVM simulation or RPC call)
        /// to identify and extract the revert reason.
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string (e.g., "0x08c379a0...").</param>
        /// <returns>A <see cref="RevertReason"/> object containing the decoded information.</returns>
        public static RevertReason Decode(string hexReturnData)
        {
            var result = new RevertReason
            {
                RawReturnData = hexReturnData
            };

            // Handle empty or malformed data upfront
            if (string.IsNullOrEmpty(hexReturnData) || hexReturnData == "0x")
            {
                result.IsEmptyRevert = true;
                return result;
            }

            // Remove "0x" prefix for easier processing
            string cleanData = hexReturnData.RemoveHexPrefix();

            // Return data must be at least 4 bytes (8 hex characters) to contain a selector.
            if (cleanData.Length < 8)
            {
                // Not enough data for a valid selector, treat as an empty or arbitrary revert.
                result.IsEmptyRevert = true;
                return result;
            }

            string selector = "0x" + cleanData.Substring(0, 8);

            // Check if it's a standard Solidity `Error(string)` revert
            if (selector.Equals(StandardRevertErrorSelector, StringComparison.OrdinalIgnoreCase))
            {
                result.IsStandardRevert = true;
                try
                {
                    // The ABI-encoded string payload follows the 4-byte selector.
                    // A valid ABI-encoded string requires at least 64 hex characters (32 bytes offset + 32 bytes length).
                    var stringAbiEncodedData = cleanData.Substring(8);

                    if (stringAbiEncodedData.Length >= 64) 
                    {
                        var bytesToDecode = stringAbiEncodedData.HexToByteArray();
                        result.DecodedMessage = _stringDecoder.Decode(bytesToDecode, typeof(string)) as string;
                    }
                    else
                    {
                        // Data started with standard selector but was too short or malformed for a valid string.
                        // We still flag IsStandardRevert but DecodedMessage will be null.
                    }
                }
                catch (Exception)
                {
                    // Decoding failed, possibly malformed ABI data after the selector.
                    // IsStandardRevert remains true, but DecodedMessage will be null.
                }
            }
            else
            {
                // Not a standard Error(string) revert, classify as a custom error.
                result.IsCustomError = true;
                result.CustomErrorSelector = selector;
                result.CustomErrorData = "0x" + cleanData.Substring(8); // All data after the selector
            }

            return result;
        }

        /// <summary>
        /// Retrieves the decoded string message from a standard Solidity `Error(string)` revert reason.
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string.</param>
        /// <returns>The decoded string message, or null if it's not a standard revert or decoding fails.</returns>
        public static string GetStandardRevertString(string hexReturnData)
        {
            var decoded = Decode(hexReturnData);
            return decoded.IsStandardRevert ? decoded.DecodedMessage : null;
        }

        /// <summary>
        /// Checks if the raw return data represents a standard Solidity `Error(string)` revert.
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string.</param>
        /// <returns>True if it's a standard revert, false otherwise.</returns>
        public static bool IsStandardRevert(string hexReturnData)
        {
            return Decode(hexReturnData).IsStandardRevert;
        }

        /// <summary>
        /// Checks if the raw return data represents a custom Solidity error.
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string.</param>
        /// <returns>True if it's a custom error, false otherwise.</returns>
        public static bool IsCustomError(string hexReturnData)
        {
            return Decode(hexReturnData).IsCustomError;
        }

        /// <summary>
        /// Retrieves the 4-byte selector of a custom Solidity error.
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string.</param>
        /// <returns>The 4-byte selector as a hex string, or null if it's not a custom error.</returns>
        public static string GetCustomErrorSelector(string hexReturnData)
        {
            var decoded = Decode(hexReturnData);
            return decoded.IsCustomError ? decoded.CustomErrorSelector : null;
        }

        /// <summary>
        /// Retrieves the raw ABI-encoded data of a custom Solidity error (after the selector).
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string.</param>
        /// <returns>The raw encoded parameters as a hex string, or null if it's not a custom error.</returns>
        public static string GetCustomErrorData(string hexReturnData)
        {
            var decoded = Decode(hexReturnData);
            return decoded.IsCustomError ? decoded.CustomErrorData : null;
        }

        /// <summary>
        /// Checks if the raw return data represents an empty revert (no selector or data, or data too short).
        /// </summary>
        /// <param name="hexReturnData">The raw return data as a hex string.</param>
        /// <returns>True if it's an empty revert, false otherwise.</returns>
        public static bool IsEmptyRevert(string hexReturnData)
        {
            return Decode(hexReturnData).IsEmptyRevert;
        }
    }
}