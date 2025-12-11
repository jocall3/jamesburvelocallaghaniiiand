using Nethereum.ABI;
using Nethereum.ABI.Decoders;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Util;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace Nethereum.Contracts.Services.Cognitive
{
    public class EventSignatureDecoder
    {
        private readonly Dictionary<string, ABI> _abisByContractAddress;

        public EventSignatureDecoder(Dictionary<string, ABI> abisByContractAddress)
        {
            _abisByContractAddress = abisByContractAddress ?? new Dictionary<string, ABI>();
        }

        public EventSignatureDecoder(Dictionary<string, string> abiJsonByContractAddress)
        {
            _abisByContractAddress = new Dictionary<string, ABI>();
            foreach (var kvp in abiJsonByContractAddress)
            {
                try
                {
                    var abi = ABI.FromJson(kvp.Value);
                    _abisByContractAddress.Add(kvp.Key, abi);
                }
                catch (Exception ex)
                {
                    // Log or handle exception if an ABI JSON is invalid
                    System.Diagnostics.Debug.WriteLine($"Error parsing ABI for contract {kvp.Key}: {ex.Message}");
                }
            }
        }

        public List<DecodedEvent> DecodeLogs(Log[] logs)
        {
            var decodedEvents = new List<DecodedEvent>();

            foreach (var log in logs)
            {
                if (!_abisByContractAddress.TryGetValue(log.Address.ToLower(), out var abi))
                {
                    // No known ABI for this contract address, skip or log unknown event
                    decodedEvents.Add(new DecodedEvent
                    {
                        Address = log.Address,
                        IsDecoded = false,
                        RawLog = log
                    });
                    continue;
                }

                var decodedEvent = DecodeLog(log, abi);
                decodedEvents.Add(decodedEvent);
            }

            return decodedEvents;
        }

        private DecodedEvent DecodeLog(Log log, ABI abi)
        {
            if (log.Topics == null || log.Topics.Length == 0)
            {
                return new DecodedEvent { Address = log.Address, IsDecoded = false, RawLog = log };
            }

            var eventSignature = log.Topics[0];
            var contractEvents = abi.Events.Where(e => e.Signature == eventSignature).ToList();

            if (!contractEvents.Any())
            {
                return new DecodedEvent { Address = log.Address, IsDecoded = false, RawLog = log };
            }

            // Assuming a unique signature for simplicity, in real scenarios, multiple events *could* share a signature if types differ wildly, but typically this is unique per contract.
            var contractEvent = contractEvents.First();

            var indexedArgs = new List<object>();
            var decodedParameters = new List<ParameterOutput>();

            var decoder = new ABIDecoder(abi.Types);

            // Decode indexed parameters from topics (excluding signature at index 0)
            for (int i = 1; i < log.Topics.Length; i++)
            {
                var topic = log.Topics[i];
                if (i - 1 < contractEvent.Inputs.Count)
                {
                    var input = contractEvent.Inputs[i - 1];
                    if (input.Indexed)
                    {
                        try
                        {
                            var decodedValue = decoder.DecodeSingle(input.Type, topic);
                            indexedArgs.Add(decodedValue);
                            decodedParameters.Add(new ParameterOutput { Name = input.Name, Type = input.Type, Value = decodedValue });
                        }
                        catch (Exception ex)
                        {
                            System.Diagnostics.Debug.WriteLine($"Error decoding indexed topic {i}: {ex.Message}");
                            indexedArgs.Add($"Error decoding: {topic.Substring(0, Math.Min(topic.Length, 10))}...");
                        }
                    }
                }
            }

            // Decode non-indexed data parameter from Data field
            byte[] dataBytes = null;
            if (!string.IsNullOrEmpty(log.Data) && log.Data != "0x")
            {
                dataBytes = log.Data.HexToByteArray();
            }

            var decodedData = DecodeEventData(contractEvent, dataBytes, decoder);
            decodedParameters.AddRange(decodedData);


            return new DecodedEvent
            {
                Address = log.Address,
                IsDecoded = true,
                EventName = contractEvent.Name,
                Signature = eventSignature,
                RawLog = log,
                DecodedParameters = decodedParameters,
                ContractABI = abi
            };
        }

        private List<ParameterOutput> DecodeEventData(Event contractEvent, byte[] dataBytes, ABIDecoder decoder)
        {
            var decodedData = new List<ParameterOutput>();
            if (dataBytes == null || dataBytes.Length == 0)
            {
                return decodedData;
            }

            var nonIndexedInputs = contractEvent.Inputs.Where(x => !x.Indexed).ToList();

            if (!nonIndexedInputs.Any())
            {
                return decodedData;
            }

            try
            {
                var decodedValues = decoder.DecodeMultipleValues<object>(dataBytes, nonIndexedInputs.Select(i => i.Type).ToArray());

                for (int i = 0; i < nonIndexedInputs.Count; i++)
                {
                    decodedData.Add(new ParameterOutput
                    {
                        Name = nonIndexedInputs[i].Name,
                        Type = nonIndexedInputs[i].Type,
                        Value = decodedValues[i]
                    });
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error decoding event data for {contractEvent.Name}: {ex.Message}");
            }

            return decodedData;
        }
    }

    public class DecodedEvent
    {
        public string Address { get; set; }
        public bool IsDecoded { get; set; }
        public string EventName { get; set; }
        public string Signature { get; set; }
        public Log RawLog { get; set; }
        public List<ParameterOutput> DecodedParameters { get; set; } = new List<ParameterOutput>();
        public ABI ContractABI { get; set; }
    }

    public class ParameterOutput
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public object Value { get; set; }
    }
}