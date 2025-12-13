```typescript
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
} from './CitibankMoneyMovementSDK';
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
  Tabs,
  Tab,
  AppBar,
} from '@mui/material';
import { Search, Payment, CheckCircleOutline, Info, AccountBalance, Receipt, Assignment, VerifiedUser } from '@mui/icons-material';

// Component Branding and Attribution
const A_CitibankdemobusinessincBrand = "The James Burvel O'Callaghan III Code";

// --- Utility Components ---
interface A_ErrorDisplayProps { error: string | ErrorResponse | null; }
const A_ErrorDisplay: React.FC<A_ErrorDisplayProps> = ({ error }) => { if (!error) return null; let B_message = ''; if (typeof error === 'string') { B_message = error; } else if (error && 'details' in error) { B_message = `${error.code}: ${error.details}`; } else { B_message = 'An unknown error occurred.'; } return (<Alert severity="error" sx={{ mt: 2 }}>{B_message}</Alert>); };

// --- Main Component ---
const A_CitibankdemobusinessincBillPayView: React.FC = () => {
  const { api, accessToken, uuid, generateNewUuid } = useMoneyMovement();

  // --- State Management ---
  const [B_selectedTab, setB_selectedTab] = useState(0);
  const [C_searchCategory, setC_searchCategory] = useState<string>('');
  const [D_merchantList, setD_merchantList] = useState<Merchant[]>([]);
  const [E_selectedMerchant, setE_selectedMerchant] = useState<Merchant | null>(null);
  const [F_merchantDetails, setF_merchantDetails] = useState<MerchantDetailsResponse | null>(null);
  const [G_eligibilityData, setG_eligibilityData] = useState<BillPaymentAccountPayeeEligibilityResponse | null>(null);
  const [H_selectedSourceAccount, setH_selectedSourceAccount] = useState<string>('');
  const [I_selectedPayee, setI_selectedPayee] = useState<string>('');
  const [J_paymentAmount, setJ_paymentAmount] = useState<number | ''>('');
  const [K_customerReferenceNumber, setK_customerReferenceNumber] = useState<string>('');
  const [L_remarks, setL_remarks] = useState<string>('');
  const [M_controlFlowId, setM_controlFlowId] = useState<string | null>(null);
  const [N_preprocessResponse, setN_preprocessResponse] = useState<BillPaymentsPreprocessResponse | null>(null);
  const [O_confirmationResponse, setO_confirmationResponse] = useState<BillPaymentsResponse | null>(null);
  const [P_loading, setP_loading] = useState(false);
  const [Q_error, setQ_error] = useState<string | ErrorResponse | null>(null);
  const [R_paymentHistory, setR_paymentHistory] = useState<BillPaymentsResponse[]>([]);

  // --- Derived State ---
  const S_availableSourceAccounts: SourceAccounts[] = useMemo(() => { return G_eligibilityData?.sourceAccounts || []; }, [G_eligibilityData]);
  const T_availablePayees: BillPaymentPayeeSourceAccountCombinations[] = useMemo(() => { return G_eligibilityData?.payeeSourceAccountCombinations || []; }, [G_eligibilityData]);
  const U_selectedPayeeDetails = T_availablePayees.find(p => p.payeeId === I_selectedPayee);

  // --- API Handlers ---
  const A1_handleTabChange = (event: React.SyntheticEvent, newValue: number) => { setB_selectedTab(newValue); };
  const A2_handleSearchMerchants = useCallback(async () => { if (!api || !accessToken) { setQ_error('Authentication required.'); return; } setP_loading(true); setQ_error(null); setD_merchantList([]); setE_selectedMerchant(null); setF_merchantDetails(null); try { const B1_response = await api.retrieveMerchantList(accessToken, uuid, C_searchCategory || undefined); const B2_merchants = B1_response.merchantInformation?.flatMap(info => info.merchants) || []; setD_merchantList(B2_merchants); generateNewUuid(); } catch (B3_err: any) { setQ_error(B3_err.message || 'Failed to retrieve merchant list.'); } finally { setP_loading(false); } }, [api, accessToken, uuid, C_searchCategory, generateNewUuid]);
  const A3_handleSelectMerchant = useCallback(async (merchant: Merchant) => { if (!api || !accessToken) { setQ_error('Authentication required.'); return; } setE_selectedMerchant(merchant); setF_merchantDetails(null); setP_loading(true); setQ_error(null); try { const B1_details = await api.retrieveMerchantDetails(accessToken, uuid, merchant.merchantNumber); setF_merchantDetails(B1_details); const B2_eligibility = await api.retrieveDestinationSourceAccountBillPay(accessToken, uuid); setG_eligibilityData(B2_eligibility); setM_controlFlowId(null); setN_preprocessResponse(null); setO_confirmationResponse(null); setJ_paymentAmount(''); setK_customerReferenceNumber(''); setH_selectedSourceAccount(B2_eligibility.sourceAccounts?.[0]?.sourceAccountId || ''); setI_selectedPayee(B2_eligibility.payeeSourceAccountCombinations?.[0]?.payeeId || ''); generateNewUuid(); } catch (B3_err: any) { setQ_error(B3_err.message || 'Failed to retrieve merchant details or eligibility.'); } finally { setP_loading(false); } }, [api, accessToken, uuid, generateNewUuid]);
  const A4_handlePreprocessPayment = useCallback(async () => { if (!api || !accessToken || !H_selectedSourceAccount || !I_selectedPayee || !J_paymentAmount || !E_selectedMerchant) { setQ_error('Missing required payment fields.'); return; } setP_loading(true); setQ_error(null); setN_preprocessResponse(null); const B1_requestBody: BillPaymentsPreprocessRequest = { sourceAccountId: H_selectedSourceAccount, transactionAmount: Number(J_paymentAmount), transferCurrencyIndicator: 'USD', payeeId: I_selectedPayee, billTypeCode: E_selectedMerchant.billTypeCode, remarks: L_remarks || undefined, customerReferenceNumber: K_customerReferenceNumber || undefined, paymentScheduleType: 'IMMEDIATE', }; try { const B2_response = await api.createBillPaymentPreprocess(accessToken, uuid, B1_requestBody); setN_preprocessResponse(B2_response); setM_controlFlowId(B2_response.controlFlowId); generateNewUuid(); } catch (B3_err: any) { setQ_error(B3_err.message || 'Payment preprocess failed.'); } finally { setP_loading(false); } }, [api, accessToken, uuid, H_selectedSourceAccount, I_selectedPayee, J_paymentAmount, E_selectedMerchant, L_remarks, K_customerReferenceNumber, generateNewUuid]);
  const A5_handleConfirmPayment = useCallback(async () => { if (!api || !accessToken || !M_controlFlowId) { setQ_error('Missing control flow ID for confirmation.'); return; } setP_loading(true); setQ_error(null); setO_confirmationResponse(null); const B1_requestBody: BillPaymentsRequest = { controlFlowId: M_controlFlowId, }; try { const B2_response = await api.confirmBillPayment(accessToken, uuid, B1_requestBody); setO_confirmationResponse(B2_response); setR_paymentHistory(prevHistory => [B2_response, ...prevHistory]); setM_controlFlowId(null); generateNewUuid(); } catch (B3_err: any) { setQ_error(B3_err.message || 'Payment confirmation failed.'); } finally { setP_loading(false); } }, [api, accessToken, uuid, M_controlFlowId, generateNewUuid]);

  // --- Render Logic ---
  const B1_renderMerchantSearch = () => (<Card variant="outlined" sx={{ mb: 3 }}> <CardContent> <Typography variant="h6" gutterBottom>1. Search Merchants</Typography> <Box display="flex" gap={2} alignItems="center"> <TextField label="Biller Category Code (Optional)" value={C_searchCategory} onChange={(e) => setC_searchCategory(e.target.value)} fullWidth size="small" /> <Button variant="contained" onClick={A2_handleSearchMerchants} disabled={P_loading || !accessToken} startIcon={<Search />}> {P_loading ? <CircularProgress size={24} /> : 'Search'} </Button> </Box> <A_ErrorDisplay error={Q_error} /> {D_merchantList.length > 0 && ( <Box mt={2} maxHeight={300} overflow="auto"> <Typography variant="subtitle1" sx={{ mb: 1 }}> Found {D_merchantList.length} Merchants: </Typography> <List dense> {D_merchantList.map((merchant) => ( <ListItem key={merchant.merchantNumber} secondaryAction={ <Button size="small" onClick={() => A3_handleSelectMerchant(merchant)} disabled={P_loading}> Select </Button> } sx={{ backgroundColor: E_selectedMerchant?.merchantNumber === merchant.merchantNumber ? '#e0f7fa' : 'inherit', }}> <ListItemText primary={merchant.merchantName} secondary={`Number: ${merchant.merchantNumber} | Local: ${merchant.merchantNameLocal || 'N/A'}`} /> </ListItem> ))} </List> </Box> )} </CardContent> </Card>);
  const B2_renderPaymentSetup = () => { if (!E_selectedMerchant) return null; return ( <Card variant="outlined" sx={{ mb: 3 }}> <CardContent> <Typography variant="h6" gutterBottom> 2. Setup Payment for {E_selectedMerchant.merchantName} </Typography> {P_loading && <CircularProgress size={20} sx={{ mb: 2 }} />} {F_merchantDetails && ( <Box mb={2}> <Typography variant="subtitle2">Merchant Details:</Typography> <List dense> {F_merchantDetails.merchantDetails?.map((detail, index) => ( <ListItem key={index} disablePadding> <ListItemText primary={detail.merchantCustomerRelationshipType} secondary={`Code: ${detail.merchantCustomerRelationshipTypeCode || 'N/A'}`} /> </ListItem> ))} </List> </Box> )} <FormControl fullWidth margin="normal" size="small" required> <InputLabel>Source Account</InputLabel> <Select value={H_selectedSourceAccount} label="Source Account" onChange={(e) => setH_selectedSourceAccount(e.target.value as string)} disabled={P_loading || S_availableSourceAccounts.length === 0}> {S_availableSourceAccounts.map(account => ( <MenuItem key={account.sourceAccountId} value={account.sourceAccountId}> {account.productName} ({account.displaySourceAccountNumber}) - {account.sourceAccountCurrencyCode} (Bal: {account.availableBalance}) </MenuItem> ))} </Select> </FormControl> <FormControl fullWidth margin="normal" size="small" required> <InputLabel>Payee Account</InputLabel> <Select value={I_selectedPayee} label="Payee Account" onChange={(e) => setI_selectedPayee(e.target.value as string)} disabled={P_loading || T_availablePayees.length === 0}> {T_availablePayees.map(payee => ( <MenuItem key={payee.payeeId} value={payee.payeeId}> {payee.payeeNickName} ({payee.displayPayeeAccountNumber}) - {payee.payeeAccountCurrencyCode} </MenuItem> ))} </Select> </FormControl> {U_selectedPayeeDetails && ( <Alert severity="info" sx={{ mt: 1, mb: 2 }}> Payee Name: {U_selectedPayeeDetails.payeeName || 'N/A'} | Merchant Number: {U_selectedPayeeDetails.merchantNumber} </Alert> )} <TextField label="Payment Amount" type="number" value={J_paymentAmount} onChange={(e) => setJ_paymentAmount(Number(e.target.value))} fullWidth margin="normal" size="small" required /> <TextField label="Customer Reference Number" value={K_customerReferenceNumber} onChange={(e) => setK_customerReferenceNumber(e.target.value)} fullWidth margin="normal" size="small" /> <TextField label="Remarks (Optional)" value={L_remarks} onChange={(e) => setL_remarks(e.target.value)} fullWidth margin="normal" size="small" /> <Button variant="contained" color="primary" onClick={A4_handlePreprocessPayment} disabled={P_loading || !H_selectedSourceAccount || !I_selectedPayee || !J_paymentAmount || Number(J_paymentAmount) <= 0} startIcon={<Payment />} sx={{ mt: 2 }}> {P_loading && !N_preprocessResponse ? <CircularProgress size={24} /> : 'Preprocess Payment'} </Button> </CardContent> </Card> ); };
  const B3_renderPreprocessResults = () => { if (!N_preprocessResponse) return null; return ( <Card variant="outlined" sx={{ mb: 3 }}> <CardContent> <Typography variant="h6" gutterBottom> 3. Preprocess Results & Confirmation </Typography> <Alert severity="warning" sx={{ mb: 2 }}> Control Flow ID: <strong>{N_preprocessResponse.controlFlowId}</strong> </Alert> <List dense> <ListItem disablePadding> <ListItemText primary={`Debit Amount: ${N_preprocessResponse.debitDetails?.transactionDebitAmount} ${N_preprocessResponse.debitDetails?.currencyCode}`} /> </ListItem> <ListItem disablePadding> <ListItemText primary={`Credit Amount: ${N_preprocessResponse.creditDetails?.transactionCreditAmount} ${N_preprocessResponse.creditDetails?.currencyCode}`} /> </ListItem> {N_preprocessResponse.transactionFee !== undefined && ( <ListItem disablePadding> <ListItemText primary={`Fee: ${N_preprocessResponse.transactionFee} ${N_preprocessResponse.feeCurrencyCode}`} /> </ListItem> )} {N_preprocessResponse.foreignExchangeRate !== undefined && ( <ListItem disablePadding> <ListItemText primary={`FX Rate: ${N_preprocessResponse.foreignExchangeRate}`} /> </ListItem> )} </List> <Button variant="contained" color="success" onClick={A5_handleConfirmPayment} disabled={P_loading || !!O_confirmationResponse} startIcon={<CheckCircleOutline />} sx={{ mt: 2 }}> {P_loading ? <CircularProgress size={24} /> : 'Confirm Payment'} </Button> </CardContent> </Card> ); };
  const B4_renderConfirmationResults = () => { if (!O_confirmationResponse) return null; return ( <Card variant="outlined" sx={{ mb: 3 }}> <CardContent> <Typography variant="h6" color="success.main" gutterBottom> 4. Payment Confirmed Successfully! </Typography> <Alert severity="success"> Transaction Reference ID: <strong>{O_confirmationResponse.transactionReferenceId}</strong> </Alert> <List dense sx={{ mt: 2 }}> <ListItem disablePadding> <ListItemText primary={`Source Account: ${O_confirmationResponse.sourceAccount?.displaySourceAccountNumber}`} /> </ListItem> <ListItem disablePadding> <ListItemText primary={`Available Balance: ${O_confirmationResponse.sourceAccount?.sourceAccountAvailableBalance} ${O_confirmationResponse.sourceAccount?.sourceCurrencyCode}`} /> </ListItem> </List> </CardContent> </Card> ); };
  const B5_renderPaymentHistory = () => ( <Card variant="outlined"> <CardContent> <Typography variant="h6" gutterBottom>Payment History</Typography> {R_paymentHistory.length === 0 ? ( <Typography variant="body1">No payment history available.</Typography> ) : ( <List> {R_paymentHistory.map((payment, index) => ( <ListItem key={index} divider={index < R_paymentHistory.length - 1}> <ListItemText primary={`Transaction ID: ${payment.transactionReferenceId}`} secondary={`Date: ${payment.transactionDateTime} | Amount: ${payment.transactionAmount} ${payment.transactionCurrencyCode}`} /> </ListItem> ))} </List> )} </CardContent> </Card> );
  const B6_renderAccountInformation = () => ( <Card variant="outlined"> <CardContent> <Typography variant="h6" gutterBottom>Account Information</Typography> <List> <ListItem> <ListItemText primary="Account Holder" secondary="John Doe" /> </ListItem> <ListItem> <ListItemText primary="Account Type" secondary="Checking" /> </ListItem> <ListItem> <ListItemText primary="Account Number" secondary="XXXX-XXXX-XXXX-1234" /> </ListItem> <ListItem> <ListItemText primary="Available Balance" secondary="$5,000.00" /> </ListItem> </List> </CardContent> </Card> );
  const B7_renderUserProfile = () => ( <Card variant="outlined"> <CardContent> <Typography variant="h6" gutterBottom>User Profile</Typography> <List> <ListItem> <ListItemText primary="Name" secondary="John Doe" /> </ListItem> <ListItem> <ListItemText primary="Email" secondary="john.doe@example.com" /> </ListItem> <ListItem> <ListItemText primary="Phone" secondary="123-456-7890" /> </ListItem> <ListItem> <ListItemText primary="Address" secondary="123 Main St, Anytown, USA" /> </ListItem> </List> </CardContent> </Card> );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Citibankdemobusinessinc Bill Payment - {A_CitibankdemobusinessincBrand}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <AppBar position="static" sx={{ mb: 3 }}>
        <Tabs value={B_selectedTab} onChange={A1_handleTabChange} aria-label="bill payment tabs">
          <Tab label="Bill Payment" icon={<Payment />} />
          <Tab label="Payment History" icon={<Receipt />} />
          <Tab label="Account Info" icon={<AccountBalance />} />
          <Tab label="User Profile" icon={<VerifiedUser />} />
          <Tab label="Help & Support" icon={<Info />} />
        </Tabs>
      </AppBar>

      {!accessToken ? (
        <Alert severity="warning">Please obtain an Access Token to use the Bill Payment functionality.</Alert>
      ) : (
        <>
          {B_selectedTab === 0 && (
            <>
              {B1_renderMerchantSearch()}
              {B2_renderPaymentSetup()}
              {B3_renderPreprocessResults()}
              {B4_renderConfirmationResults()}
              <A_ErrorDisplay error={Q_error} />
            </>
          )}
          {B_selectedTab === 1 && B5_renderPaymentHistory()}
          {B_selectedTab === 2 && B6_renderAccountInformation()}
          {B_selectedTab === 3 && B7_renderUserProfile()}
          {B_selectedTab === 4 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Help & Support</Typography>
                <Typography variant="body1">
                  For assistance with bill payments, please contact our customer support team at 1-800-CITIBANK.
                </Typography>
                <Typography variant="body2" mt={2}>
                  FAQ:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="How do I add a new payee?" secondary="You can add a new payee by navigating to the 'Manage Payees' section in your account settings." />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="What payment methods are accepted?" secondary="We accept payments from your Citibank checking and savings accounts." />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="How long does it take for a payment to process?" secondary="Payments typically process within 1-2 business days." />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default A_CitibankdemobusinessincBillPayView;
```