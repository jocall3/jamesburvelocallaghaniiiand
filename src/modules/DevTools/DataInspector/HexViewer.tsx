import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Box,
    Textarea,
    Button,
    Flex,
    Spinner,
    useClipboard,
    useToast,
    IconButton,
    Tooltip,
    Text,
    VStack,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

// Constants for display
const BYTES_PER_LINE = 16;

interface HexViewerProps {
    initialData?: string; // Hex string or raw data string
    dataType?: 'hex' | 'raw'; // Interpret input as hex string or raw data
}

const HexViewer: React.FC<HexViewerProps> = ({ initialData = "", dataType = "hex" }) => {
    const [hexString, setHexString] = useState(initialData);
    const [byteData, setByteData] = useState<number[]>([]);
    const [asciiString, setAsciiString] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { hasCopied, onCopy } = useClipboard(byteData.map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase());
    const textareaRef = useRef<any>(null);

    const processData = useCallback((data: string) => {
        setLoading(true);
        let bytes: number[] = [];
        let ascii: string = '';

        try {
            if (dataType === 'hex') {
                // Clean up hex string (remove spaces, newlines, etc., keeping only hex characters)
                const cleanHex = data.replace(/[^0-9a-fA-F]/g, '');
                for (let i = 0; i < cleanHex.length; i += 2) {
                    const byteHex = cleanHex.substring(i, i + 2);
                    if (byteHex.length === 2) {
                        bytes.push(parseInt(byteHex, 16));
                    }
                }
            } else { // raw data
                bytes = Array.from(new TextEncoder().encode(data));
            }

            // Generate ASCII representation
            ascii = bytes.map(byte => {
                // Check if it's a printable ASCII character (32 to 126)
                if (byte >= 32 && byte <= 126) {
                    return String.fromCharCode(byte);
                }
                return '.'; // Placeholder for non-printable characters
            }).join('');

        } catch (error) {
            console.error("Error processing data:", error);
            toast({
                title: "Error",
                description: "Could not process the input data.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            bytes = [];
            ascii = '';
        }

        setByteData(bytes);
        setAsciiString(ascii);
        setLoading(false);
    }, [dataType, toast]);

    useEffect(() => {
        if (initialData) {
            processData(initialData);
        }
    }, [initialData, dataType, processData]);

    const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHexString(e.target.value);
    };

    const handleProcessClick = () => {
        processData(hexString);
    };

    const handleCopyHex = () => {
        onCopy();
        toast({
            title: hasCopied ? "Copied Hex" : "Error",
            description: hasCopied ? "Hexadecimal data copied to clipboard." : "Failed to copy.",
            status: hasCopied ? "success" : "error",
            duration: 2000,
            isClosable: true,
        });
    };

    const renderHexView = () => {
        const lines: JSX.Element[] = [];
        const totalBytes = byteData.length;

        for (let i = 0; i < totalBytes; i += BYTES_PER_LINE) {
            const offset = i;
            const lineBytes = byteData.slice(i, i + BYTES_PER_LINE);
            const lineAscii = asciiString.slice(i, i + BYTES_PER_LINE);

            const offsetDisplay = offset.toString(16).padStart(8, '0');

            const hexDisplay = lineBytes.map(b => (
                <Text as="span" fontFamily="monospace" mx={0.5} whiteSpace="pre">
                    {b.toString(16).padStart(2, '0').toUpperCase()}
                </Text>
            )).reduce((acc, curr) => [acc, curr], [] as (JSX.Element | JSX.Element[]));

            // Pad hex display if the last line is short
            while (hexDisplay.length < BYTES_PER_LINE * 2) { // ~2 chars per byte + spacing overhead
                 hexDisplay.push(<Text as="span" fontFamily="monospace" mx={0.5} whiteSpace="pre" color="gray.500" key={`pad-hex-${offset}-${hexDisplay.length}`}>
                    00 
                </Text>);
            }
            
            const asciiDisplay = Array.from(lineAscii).map((char, index) => (
                <Text as="span" fontFamily="monospace" mx={0.5} whiteSpace="pre" key={`ascii-${offset}-${index}`}>
                    {char}
                </Text>
            ));


            lines.push(
                <Flex key={offset} justifyContent="space-between" mb={1} fontSize="sm">
                    <Text fontFamily="monospace" w="8ch" color="teal.500">{offsetDisplay}</Text>
                    <Flex flexWrap="nowrap" overflow="hidden" w="100%">
                        <Box whiteSpace="pre">
                            {hexDisplay}
                        </Box>
                        <Box ml={4} whiteSpace="pre">
                            {asciiDisplay}
                        </Box>
                    </Flex>
                </Flex>
            );
        }

        return lines.length > 0 ? <VStack align="stretch" spacing={0}>{lines}</VStack> : <Text color="gray.500">No data to display.</Text>;
    };

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <Text fontSize="lg" fontWeight="bold" mb={3}>Hex Data Inspector</Text>

            <Textarea
                ref={textareaRef}
                value={hexString}
                onChange={handleDataChange}
                placeholder={`Enter ${dataType === 'hex' ? 'hexadecimal string' : 'raw data string'} here...`}
                rows={10}
                fontFamily="monospace"
                bg="white"
                mb={3}
            />

            <Flex mb={4} gap={3} wrap="wrap">
                <Button
                    colorScheme="blue"
                    onClick={handleProcessClick}
                    isDisabled={loading || hexString.length === 0}
                >
                    Analyze Data
                </Button>
                <Button
                    leftIcon={<CopyIcon />}
                    onClick={handleCopyHex}
                    isDisabled={loading || byteData.length === 0}
                    variant={hasCopied ? "solid" : "outline"}
                    colorScheme={hasCopied ? "green" : "gray"}
                >
                    {hasCopied ? 'Copied!' : 'Copy Hex Output'}
                </Button>
                <Tooltip label={`Viewing data as: ${dataType.toUpperCase()}`}>
                    <Text
                        p={2}
                        borderRadius="md"
                        bg="orange.100"
                        fontSize="sm"
                        fontWeight="medium"
                    >
                        Mode: {dataType.toUpperCase()}
                    </Text>
                </Tooltip>
            </Flex>

            {loading && (
                <Flex justify="center" align="center" height="100px">
                    <Spinner size="lg" color="blue.500" />
                    <Text ml={3}>Processing...</Text>
                </Flex>
            )}

            {!loading && byteData.length > 0 && (
                <Box mt={4} p={3} bg="blackAlpha.50" borderRadius="md" overflowX="auto" maxHeight="500px">
                    <Text mb={2} fontWeight="bold" color="gray.700">Hex Dump ({byteData.length} bytes):</Text>
                    {renderHexView()}
                </Box>
            )}

            {!loading && byteData.length === 0 && hexString.length > 0 && (
                <Text color="red.500" mt={2}>Analysis resulted in no valid data. Check input format for '{dataType}' mode.</Text>
            )}
        </Box>
    );
};

export default HexViewer;