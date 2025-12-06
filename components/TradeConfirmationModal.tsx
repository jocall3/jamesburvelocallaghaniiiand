
import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  useDisclosure,
  Text,
  Code,
  Stack,
  Heading,
  useBreakpointValue,
} from '@chakra-ui/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SettlementInstruction } from './types';
import { ExternalPurpose1CodeEnum } from './types/generated/sese.023.001.13';

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementInstruction: SettlementInstruction | null;
}

const TradeConfirmationModal: React.FC<TradeConfirmationModalProps> = ({
  isOpen,
  onClose,
  settlementInstruction,
}) => {
  const modalSize = useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' });

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsPDF = useCallback(async () => {
    if (!settlementInstruction) return;

    setIsDownloading(true);

    const doc = new jsPDF();

    doc.text('Settlement Instruction Details', 10, 10);

    (doc as any).autoTable({
      head: [['Field', 'Value']],
      body: [
        ['Message Identification', settlementInstruction.messageId],
        ['Creation Date Time', settlementInstruction.creationDateTime],
        [
          'Number of Transactions',
          settlementInstruction.numberOfTransactions.toString(),
        ],
        ['Settlement Date', settlementInstruction.settlementDate],
        ['Total Amount', settlementInstruction.totalAmount.toString()],
        ['Currency', settlementInstruction.currency],
        [
          'Purpose',
          settlementInstruction.purpose
            ? ExternalPurpose1CodeEnum[settlementInstruction.purpose]
            : 'N/A',
        ],
      ],
      startY: 20,
    });

    doc.save('settlement_instruction.pdf');
    setIsDownloading(false);
  }, [settlementInstruction]);

  if (!settlementInstruction) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settlement Instruction Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <Box>
              <Heading size="sm">Message Details</Heading>
              <Text>
                <Text as="b">Message ID:</Text>{' '}
                <Code>{settlementInstruction.messageId}</Code>
              </Text>
              <Text>
                <Text as="b">Creation Date Time:</Text>{' '}
                {settlementInstruction.creationDateTime}
              </Text>
            </Box>

            <Box>
              <Heading size="sm">Transaction Summary</Heading>
              <Text>
                <Text as="b">Number of Transactions:</Text>{' '}
                {settlementInstruction.numberOfTransactions}
              </Text>
              <Text>
                <Text as="b">Settlement Date:</Text>{' '}
                {settlementInstruction.settlementDate}
              </Text>
              <Text>
                <Text as="b">Total Amount:</Text>{' '}
                {settlementInstruction.totalAmount} {settlementInstruction.currency}
              </Text>
              <Text>
                <Text as="b">Purpose:</Text>{' '}
                {settlementInstruction.purpose ? ExternalPurpose1CodeEnum[settlementInstruction.purpose] : 'N/A'}
              </Text>
            </Box>

            <Box>
              <Button
                colorScheme="blue"
                onClick={downloadAsPDF}
                isLoading={isDownloading}
                width="100%"
              >
                Download as PDF
              </Button>
            </Box>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TradeConfirmationModal;
