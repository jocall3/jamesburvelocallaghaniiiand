import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tfoot,
  IconButton,
  Flex,
} from '@chakra-ui/react';

// Inline SVG icons
const AddSVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 4a.5.5 0 0 1 .5.5V7.5H11a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V8.5H5a.5.5 0 0 1 0-1h2.5V4.5A.5.5 0 0 1 8 4z"/>
  </svg>
);

const DeleteSVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5zm1 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-1 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5z"/>
  </svg>
);

type SweepRule = {
  id: number;
  purposeCode: string;
  balanceTypeCode: string;
  threshold: number;
  currency: string;
  isActive: boolean;
};

const MOCK_PURPOSE_CODES = [
  { value: 'ZABA', label: 'Zero Balance Account (ZABA)' },
  { value: 'SWEP', label: 'Sweep (SWEP)' },
  { value: 'TOPG', label: 'Top Up (TOPG)' },
  { value: 'CASH', label: 'Cash Management (CASH)' },
];

const MOCK_BALANCE_TYPE_CODES = [
  { value: 'CLAV', label: 'Closing Available Balance (CLAV)' },
  { value: 'OPAV', label: 'Opening Available Balance (OPAV)' },
  { value: 'ITAV', label: 'Interim Available Balance (ITAV)' },
];

const MOCK_INITIAL_RULES: SweepRule[] = [
  { id: 1, purposeCode: 'SWEP', balanceTypeCode: 'CLAV', threshold: 10000, currency: 'EUR', isActive: true },
  { id: 2, purposeCode: 'TOPG', balanceTypeCode: 'OPAV', threshold: 50000, currency: 'USD', isActive: false },
];

const AutomatedSweepRules: React.FC = () => {
  const [rules, setRules] = useState<SweepRule[]>(MOCK_INITIAL_RULES);
  const [newRule, setNewRule] = useState<Omit<SweepRule, 'id' | 'isActive'>>({
    purposeCode: MOCK_PURPOSE_CODES[0].value,
    balanceTypeCode: MOCK_BALANCE_TYPE_CODES[0].value,
    threshold: 0,
    currency: 'EUR',
  });
  const [isNewRuleActive, setIsNewRuleActive] = useState(true);

  const nextId = useMemo(() => rules.reduce((max, r) => Math.max(max, r.id), 0) + 1, [rules]);

  const handleNewRuleChange = useCallback((key: keyof typeof newRule, value: any) => {
    setNewRule(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAddRule = useCallback(() => {
    if (newRule.threshold <= 0) {
      console.warn('Threshold must be greater than zero.');
      return;
    }

    const ruleToAdd: SweepRule = { ...newRule, id: nextId, isActive: isNewRuleActive };
    setRules(prev => [...prev, ruleToAdd]);
    console.log('Rule added:', ruleToAdd);

    setNewRule(prev => ({ ...prev, threshold: 0, balanceTypeCode: MOCK_BALANCE_TYPE_CODES[0].value }));
  }, [newRule, nextId, isNewRuleActive]);

  const handleDeleteRule = useCallback((id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
    console.log(`Rule ID ${id} deleted`);
  }, []);

  const handleToggleActive = useCallback((id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    console.log(`Rule ID ${id} toggled`);
  }, []);

  const renderRuleRow = (rule: SweepRule) => (
    <Tr key={rule.id} opacity={rule.isActive ? 1 : 0.5}>
      <Td>{rule.id}</Td>
      <Td>{rule.purposeCode}</Td>
      <Td>{rule.balanceTypeCode}</Td>
      <Td>{rule.currency}</Td>
      <Td isNumeric>{rule.threshold.toLocaleString()}</Td>
      <Td>
        <Switch
          isChecked={rule.isActive}
          onChange={() => handleToggleActive(rule.id)}
          colorScheme="green"
        />
      </Td>
      <Td>
        <IconButton
          aria-label="Delete rule"
          icon={DeleteSVG}
          size="sm"
          colorScheme="red"
          onClick={() => handleDeleteRule(rule.id)}
        />
      </Td>
    </Tr>
  );

  return (
    <Box p={8} maxW="5xl" mx="auto">
      <Text fontSize="2xl" fontWeight="bold" mb={6}>Automated Sweep Rules Configuration</Text>

      {/* New Rule Form */}
      <VStack spacing={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
        <Text fontSize="lg" fontWeight="bold">Add New Sweep Rule</Text>

        <HStack w="100%" spacing={4}>
          <FormControl isRequired>
            <FormLabel>Purpose</FormLabel>
            <Select
              value={newRule.purposeCode}
              onChange={e => handleNewRuleChange('purposeCode', e.target.value)}
            >
              {MOCK_PURPOSE_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Balance Type</FormLabel>
            <Select
              value={newRule.balanceTypeCode}
              onChange={e => handleNewRuleChange('balanceTypeCode', e.target.value)}
            >
              {MOCK_BALANCE_TYPE_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </FormControl>
        </HStack>

        <HStack w="100%" spacing={4}>
          <FormControl isRequired>
            <FormLabel>Threshold Amount</FormLabel>
            <NumberInput
              value={newRule.threshold}
              onChange={value => handleNewRuleChange('threshold', parseFloat(value) || 0)}
              min={0}
              precision={2}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Currency</FormLabel>
            <Input
              value={newRule.currency}
              onChange={e => handleNewRuleChange('currency', e.target.value.toUpperCase())}
              maxLength={3}
            />
          </FormControl>
        </HStack>

        <HStack w="100%" justifyContent="space-between" pt={2}>
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="new-active-switch" mb="0">Active?</FormLabel>
            <Switch
              id="new-active-switch"
              isChecked={isNewRuleActive}
              onChange={() => setIsNewRuleActive(prev => !prev)}
              colorScheme="green"
            />
          </FormControl>

          <Button leftIcon={AddSVG} colorScheme="blue" onClick={handleAddRule}>Add Rule</Button>
        </HStack>
      </VStack>

      {/* Rules Table */}
      <VStack spacing={4} mt={8} align="stretch">
        <Text fontSize="xl" fontWeight="semibold">Configured Sweep Rules</Text>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg="gray.100">
                <Th>ID</Th>
                <Th>Purpose Code</Th>
                <Th>Balance Type</Th>
                <Th>Currency</Th>
                <Th isNumeric>Threshold</Th>
                <Th>Active</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rules.length > 0 ? rules.map(renderRuleRow) : (
                <Tr>
                  <Td colSpan={7} textAlign="center" color="gray.500">No sweep rules configured yet.</Td>
                </Tr>
              )}
            </Tbody>
            <Tfoot>{/* Optional summary */}</Tfoot>
          </Table>
        </Box>
      </VStack>

      <Flex justifyContent="flex-end" mt={6}>
        <Button colorScheme="green" size="lg">Save Configuration</Button>
      </Flex>
    </Box>
  );
};

export default AutomatedSweepRules;
