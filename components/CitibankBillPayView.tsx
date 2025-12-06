import React, { useState, useCallback, useMemo } from 'react';
import {
  useMoneyMovement,
  MerchantListResponse,
  MerchantDetailsResponse,
  BillPaymentAccountPayeeEligibilityResponse,
  BillPaymentsPreprocessRequest,
  BillPaymentsPreprocessResponse,
  BillPaymentsRequest,
  BillPaymentsResponse,
  Merchant,
  SourceAccounts,
  BillPaymentPayeeSourceAccountCombinations,
  ErrorResponse,
} from './CitibankMoneyMovementSDK'; // Assuming SDK is exported from a central file
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Search, Payment, CheckCircleOutline } from '@mui/icons-material';

// --- Utility Components ---

interface ErrorDisplayProps {
  error: string | ErrorResponse | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  let message = '';
  if (typeof error === 'string') {
    message = error;
  } else if (error && 'details' in error) {
    message = `${error.code}: ${error.details}`;
  } else {
    message = 'An unknown error occurred.';
  }

  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      {message}
    </Alert>
  );
};

// --- Main Component ---

const CitibankBillPayView: React.FC = () => {
  const { api, accessToken, uuid, generateNewUuid } = useMoneyMovement();

  // --- State Management ---
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [merchantList, setMerchantList] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetailsResponse | null>(null);

  const [eligibilityData, setEligibilityData] = useState<BillPaymentAccountPayeeEligibilityResponse | null>(null);
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<string>('');
  const [selectedPayee, setSelectedPayee] = useState<string>('');

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [customerReferenceNumber, setCustomerReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [controlFlowId, setControlFlowId] = useState<string | null>(null);
  const [preprocessResponse, setPreprocessResponse] = useState<BillPaymentsPreprocessResponse | null>(null);
  const [confirmationResponse, setConfirmationResponse] = useState<BillPaymentsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | ErrorResponse | null>(null);

  // --- Derived State ---
  const availableSourceAccounts: SourceAccounts[] = useMemo(() => {
    return eligibilityData?.sourceAccounts || [];
  }, [eligibilityData]);

  const availablePayees: BillPaymentPayeeSourceAccountCombinations[] = useMemo(() => {
    return eligibilityData?.payeeSourceAccountCombinations || [];
  }, [eligibilityData]);

  const selectedPayeeDetails = availablePayees.find(p => p.payeeId === selectedPayee);

  // --- API Handlers ---

  const handleSearchMerchants = useCallback(async () => {
    if (!api || !accessToken) {
      setError('Authentication required.');
      return;
    }
    setLoading(true);
    setError(null);
    setMerchantList([]);
    setSelectedMerchant(null);
    setMerchantDetails(null);

    try {
      const response = await api.retrieveMerchantList(accessToken, uuid, searchCategory || undefined);
      const merchants = response.merchantInformation?.flatMap(info => info.merchants) || [];
      setMerchantList(merchants);
      generateNewUuid();
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve merchant list.');
    } finally {
      setLoading(false);
    }
  }, [api, accessToken, uuid, searchCategory, generateNewUuid]);

  const handleSelectMerchant = useCallback(async (merchant: Merchant) => {
    if (!api || !accessToken) {
      setError('Authentication required.');
      return;
    }
    setSelectedMerchant(merchant);
    setMerchantDetails(null);
    setLoading(true);
    setError(null);

    try {
      // 1. Get Merchant Details
      const details = await api.retrieveMerchantDetails(accessToken, uuid, merchant.merchantNumber);
      setMerchantDetails(details);

      // 2. Get Eligibility (Source Accounts & Payees)
      const eligibility = await api.retrieveDestinationSourceAccountBillPay(accessToken, uuid);
      setEligibilityData(eligibility);

      // Reset payment flow state
      setControlFlowId(null);
      setPreprocessResponse(null);
      setConfirmationResponse(null);
      setPaymentAmount('');
      setCustomerReferenceNumber('');
      setSelectedSourceAccount(eligibility.sourceAccounts?.[0]?.sourceAccountId || '');
      setSelectedPayee(eligibility.payeeSourceAccountCombinations?.[0]?.payeeId || '');

      generateNewUuid();
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve merchant details or eligibility.');
    } finally {
      setLoading(false);
    }
  }, [api, accessToken, uuid, generateNewUuid]);

  const handlePreprocessPayment = useCallback(async () => {
    if (!api || !accessToken || !selectedSourceAccount || !selectedPayee || !paymentAmount || !selectedMerchant) {
      setError('Missing required payment fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setPreprocessResponse(null);

    const requestBody: BillPaymentsPreprocessRequest = {
      sourceAccountId: selectedSourceAccount,
      transactionAmount: Number(paymentAmount),
      transferCurrencyIndicator: 'USD', // Assuming USD for simplicity, should be dynamic based on account
      payeeId: selectedPayee,
      billTypeCode: selectedMerchant.billTypeCode,
      remarks: remarks || undefined,
      customerReferenceNumber: customerReferenceNumber || undefined,
      paymentScheduleType: 'IMMEDIATE',
    };

    try {
      const response = await api.createBillPaymentPreprocess(accessToken, uuid, requestBody);
      setPreprocessResponse(response);
      setControlFlowId(response.controlFlowId);
      generateNewUuid();
    } catch (err: any) {
      setError(err.message || 'Payment preprocess failed.');
    } finally {
      setLoading(false);
    }
  }, [api, accessToken, uuid, selectedSourceAccount, selectedPayee, paymentAmount, selectedMerchant, remarks, customerReferenceNumber, generateNewUuid]);

  const handleConfirmPayment = useCallback(async () => {
    if (!api || !accessToken || !controlFlowId) {
      setError('Missing control flow ID for confirmation.');
      return;
    }

    setLoading(true);
    setError(null);
    setConfirmationResponse(null);

    const requestBody: BillPaymentsRequest = {
      controlFlowId: controlFlowId,
    };

    try {
      const response = await api.confirmBillPayment(accessToken, uuid, requestBody);
      setConfirmationResponse(response);
      // Payment confirmed, clear control flow ID
      setControlFlowId(null);
      generateNewUuid();
    } catch (err: any) {
      setError(err.message || 'Payment confirmation failed.');
    } finally {
      setLoading(false);
    }
  }, [api, accessToken, uuid, controlFlowId, generateNewUuid]);

  // --- Render Logic ---

  const renderMerchantSearch = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          1. Search Merchants
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Biller Category Code (Optional)"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSearchMerchants}
            disabled={loading || !accessToken}
            startIcon={<Search />}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>
        <ErrorDisplay error={error} />

        {merchantList.length > 0 && (
          <Box mt={2} maxHeight={300} overflow="auto">
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Found {merchantList.length} Merchants:
            </Typography>
            <List dense>
              {merchantList.map((merchant) => (
                <ListItem
                  key={merchant.merchantNumber}
                  secondaryAction={
                    <Button
                      size="small"
                      onClick={() => handleSelectMerchant(merchant)}
                      disabled={loading}
                    >
                      Select
                    </Button>
                  }
                  sx={{
                    backgroundColor: selectedMerchant?.merchantNumber === merchant.merchantNumber ? '#e0f7fa' : 'inherit',
                  }}
                >
                  <ListItemText
                    primary={merchant.merchantName}
                    secondary={`Number: ${merchant.merchantNumber} | Local: ${merchant.merchantNameLocal || 'N/A'}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderPaymentSetup = () => {
    if (!selectedMerchant) return null;

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            2. Setup Payment for {selectedMerchant.merchantName}
          </Typography>

          {loading && <CircularProgress size={20} sx={{ mb: 2 }} />}

          {merchantDetails && (
            <Box mb={2}>
              <Typography variant="subtitle2">Merchant Details:</Typography>
              <List dense>
                {merchantDetails.merchantDetails?.map((detail, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText
                      primary={detail.merchantCustomerRelationshipType}
                      secondary={`Code: ${detail.merchantCustomerRelationshipTypeCode || 'N/A'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <FormControl fullWidth margin="normal" size="small" required>
            <InputLabel>Source Account</InputLabel>
            <Select
              value={selectedSourceAccount}
              label="Source Account"
              onChange={(e) => setSelectedSourceAccount(e.target.value as string)}
              disabled={loading || availableSourceAccounts.length === 0}
            >
              {availableSourceAccounts.map(account => (
                <MenuItem key={account.sourceAccountId} value={account.sourceAccountId}>
                  {account.productName} ({account.displaySourceAccountNumber}) - {account.sourceAccountCurrencyCode} (Bal: {account.availableBalance})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" size="small" required>
            <InputLabel>Payee Account</InputLabel>
            <Select
              value={selectedPayee}
              label="Payee Account"
              onChange={(e) => setSelectedPayee(e.target.value as string)}
              disabled={loading || availablePayees.length === 0}
            >
              {availablePayees.map(payee => (
                <MenuItem key={payee.payeeId} value={payee.payeeId}>
                  {payee.payeeNickName} ({payee.displayPayeeAccountNumber}) - {payee.payeeAccountCurrencyCode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedPayeeDetails && (
            <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
              Payee Name: {selectedPayeeDetails.payeeName || 'N/A'} | Merchant Number: {selectedPayeeDetails.merchantNumber}
            </Alert>
          )}

          <TextField
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            fullWidth
            margin="normal"
            size="small"
            required
          />
          <TextField
            label="Customer Reference Number"
            value={customerReferenceNumber}
            onChange={(e) => setCustomerReferenceNumber(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handlePreprocessPayment}
            disabled={loading || !selectedSourceAccount || !selectedPayee || !paymentAmount || Number(paymentAmount) <= 0}
            startIcon={<Payment />}
            sx={{ mt: 2 }}
          >
            {loading && !preprocessResponse ? <CircularProgress size={24} /> : 'Preprocess Payment'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderPreprocessResults = () => {
    if (!preprocessResponse) return null;

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            3. Preprocess Results & Confirmation
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Control Flow ID: <strong>{preprocessResponse.controlFlowId}</strong>
          </Alert>

          <List dense>
            <ListItem disablePadding>
              <ListItemText primary={`Debit Amount: ${preprocessResponse.debitDetails?.transactionDebitAmount} ${preprocessResponse.debitDetails?.currencyCode}`} />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary={`Credit Amount: ${preprocessResponse.creditDetails?.transactionCreditAmount} ${preprocessResponse.creditDetails?.currencyCode}`} />
            </ListItem>
            {preprocessResponse.transactionFee !== undefined && (
              <ListItem disablePadding>
                <ListItemText primary={`Fee: ${preprocessResponse.transactionFee} ${preprocessResponse.feeCurrencyCode}`} />
              </ListItem>
            )}
            {preprocessResponse.foreignExchangeRate !== undefined && (
              <ListItem disablePadding>
                <ListItemText primary={`FX Rate: ${preprocessResponse.foreignExchangeRate}`} />
              </ListItem>
            )}
          </List>

          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPayment}
            disabled={loading || !!confirmationResponse}
            startIcon={<CheckCircleOutline />}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Payment'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderConfirmationResults = () => {
    if (!confirmationResponse) return null;

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="success.main" gutterBottom>
            4. Payment Confirmed Successfully!
          </Typography>
          <Alert severity="success">
            Transaction Reference ID: <strong>{confirmationResponse.transactionReferenceId}</strong>
          </Alert>
          <List dense sx={{ mt: 2 }}>
            <ListItem disablePadding>
              <ListItemText primary={`Source Account: ${confirmationResponse.sourceAccount?.displaySourceAccountNumber}`} />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary={`Available Balance: ${confirmationResponse.sourceAccount?.sourceAccountAvailableBalance} ${confirmationResponse.sourceAccount?.sourceCurrencyCode}`} />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Citi Bill Payment
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {!accessToken ? (
        <Alert severity="warning">Please obtain an Access Token to use the Bill Payment functionality.</Alert>
      ) : (
        <>
          {renderMerchantSearch()}
          {renderPaymentSetup()}
          {renderPreprocessResults()}
          {renderConfirmationResults()}
          <ErrorDisplay error={error} />
        </>
      )}
    </Container>
  );
};

export default CitibankBillPayView;