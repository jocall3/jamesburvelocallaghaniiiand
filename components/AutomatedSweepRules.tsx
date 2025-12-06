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
  useToast,
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
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

// Define TypeScript types based on the ISO 20022 schema structure, focusing on relevant codes for sweep rules
// These are placeholders derived from the available External codes, assuming some relate to 'Purpose' or 'BalanceType'

type SweepRule = {
  id: number;
  purposeCode: string; // Corresponds to ExternalPurpose1Code (e.g., ZABA, SWEP, TOPG)
  balanceTypeCode: string; // Corresponds to ExternalBalanceType1Code or ExternalSystemBalanceType1Code
  threshold: number;
  currency: string;
  isActive: boolean;
};

// Mock data and code lists derived/inferred from the schema for UI
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
  {
    id: 1,
    purposeCode: 'SWEP',
    balanceTypeCode: 'CLAV',
    threshold: 10000,
    currency: 'EUR',
    isActive: true,
  },
  {
    id: 2,
    purposeCode: 'TOPG',
    balanceTypeCode: 'OPAV',
    threshold: 50000,
    currency: 'USD',
    isActive: false,
  },
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

  const toast = useToast();
  const nextId = useMemo(() => rules.reduce((max, rule) => Math.max(max, rule.id), 0) + 1, [rules]);

  const handleNewRuleChange = useCallback((key: keyof typeof newRule, value: any) => {
    setNewRule((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAddRule = useCallback(() => {
    if (newRule.threshold <= 0) {
      toast({
        title: 'Invalid Threshold',
        description: 'Threshold must be greater than zero.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const ruleToAdd: SweepRule = {
      ...newRule,
      id: nextId,
      isActive: isNewRuleActive,
    };

    setRules((prevRules) => [...prevRules, ruleToAdd]);
    toast({
      title: 'Rule Added',
      description: `Sweep rule for ${ruleToAdd.purposeCode} added successfully.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    // Reset new rule state (keeping currency for convenience)
    setNewRule((prev) => ({ ...prev, threshold: 0, balanceTypeCode: MOCK_BALANCE_TYPE_CODES[0].value }));
  }, [newRule, nextId, isNewRuleActive, toast]);

  const handleDeleteRule = useCallback((id: number) => {
    setRules((prevRules) => prevRules.filter((rule) => rule.id !== id));
    toast({
      title: 'Rule Deleted',
      description: `Sweep rule ID ${id} has been removed.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  const handleToggleActive = useCallback((id: number) => {
    setRules((prevRules) =>
      prevRules.map((rule) =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
    toast({
        title: 'Rule Updated',
        description: `Rule ID ${id} active status toggled.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
    });
  }, [toast]);

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
          icon={<DeleteIcon />}
          size="sm"
          colorScheme="red"
          onClick={() => handleDeleteRule(rule.id)}
        />
      </Td>
    </Tr>
  );

  const renderNewRuleForm = () => (
    <VStack spacing={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
      <Text fontSize="lg" fontWeight="bold">Add New Sweep Rule</Text>
      <HStack w="100%" spacing={4}>
        <FormControl id="new-purpose" isRequired>
          <FormLabel>Purpose</FormLabel>
          <Select
            value={newRule.purposeCode}
            onChange={(e) => handleNewRuleChange('purposeCode', e.target.value)}
          >
            {MOCK_PURPOSE_CODES.map(code => (
              <option key={code.value} value={code.value}>{code.label}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl id="new-balance-type" isRequired>
          <FormLabel>Balance Type</FormLabel>
          <Select
            value={newRule.balanceTypeCode}
            onChange={(e) => handleNewRuleChange('balanceTypeCode', e.target.value)}
          >
            {MOCK_BALANCE_TYPE_CODES.map(code => (
              <option key={code.value} value={code.value}>{code.label}</option>
            ))}
          </Select>
        </FormControl>
      </HStack>

      <HStack w="100%" spacing={4}>
        <FormControl id="new-threshold" isRequired>
          <FormLabel>Threshold Amount</FormLabel>
          <NumberInput
            value={newRule.threshold}
            onChange={(value) => handleNewRuleChange('threshold', parseFloat(value) || 0)}
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

        <FormControl id="new-currency" isRequired>
          <FormLabel>Currency</FormLabel>
          <Input
            value={newRule.currency}
            onChange={(e) => handleNewRuleChange('currency', e.target.value.toUpperCase())}
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
            onChange={() => setIsNewRuleActive((prev) => !prev)}
            colorScheme="green"
          />
        </FormControl>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleAddRule}
        >
          Add Rule
        </Button>
      </HStack>
    </VStack>
  );

  return (
    <Box p={8} maxW="5xl" mx="auto">
      <Text fontSize="2xl" fontWeight="bold" mb={6}>Automated Sweep Rules Configuration</Text>

      {/* New Rule Entry */}
      {renderNewRuleForm()}

      <VStack spacing={4} mt={8} align="stretch">
        <Text fontSize="xl" fontWeight="semibold">Configured Sweep Rules</Text>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg="gray.100">
                <Th>ID</Th>
                <Th>Purpose Code (ExternalPurpose1Code)</Th>
                <Th>Balance Type (ExternalBalanceType1Code)</Th>
                <Th>Currency</Th>
                <Th isNumeric>Threshold Amount</Th>
                <Th>Active</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rules.length > 0 ? (
                rules.map(renderRuleRow)
              ) : (
                <Tr>
                  <Td colSpan={7} textAlign="center" color="gray.500">
                    No sweep rules configured yet.
                  </Td>
                </Tr>
              )}
            </Tbody>
            <Tfoot>
                {/* Optional: Summary Tfoot */}
            </Tfoot>
          </Table>
        </Box>
      </VStack>

      <Flex justifyContent="flex-end" mt={6}>
        <Button colorScheme="green" size="lg">
          Save Configuration
        </Button>
      </Flex>
    </Box>
  );
};

export default AutomatedSweepRules;