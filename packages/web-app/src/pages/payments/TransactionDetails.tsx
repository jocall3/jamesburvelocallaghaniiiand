import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Box,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { format, fromUnixTime } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

// Placeholder type for transaction data - replace with your actual type
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: number; // Unix timestamp
  description?: string;
  paymentMethod: string;
  payerName?: string;
  payerEmail?: string;
  receiverName?: string;
  receiverEmail?: string;
  transactionFee?: number;
  notes?: string;
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));

const TransactionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true);
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/transactions/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Transaction = await response.json();
        setTransaction(data);
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          <AlertTitle>{t('error')}</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning">
          <AlertTitle>{t('noTransactionFound')}</AlertTitle>
          {t('noTransactionWithId')} {id} {t('wasFound')}
        </Alert>
      </Container>
    );
  }

  const formattedDate = format(fromUnixTime(transaction.timestamp), 'PPPppp', { locale: enUS });

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        {t('transactionDetails')}
      </Typography>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">{t('transactionId')}: {transaction.id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Item>
              <Typography variant="subtitle1">{t('amount')}:</Typography>
              <Typography>{transaction.amount} {transaction.currency}</Typography>
            </Item>
          </Grid>
          <Grid item xs={12} md={6}>
            <Item>
              <Typography variant="subtitle1">{t('status')}:</Typography>
              <Typography>{t(transaction.status)}</Typography>
            </Item>
          </Grid>
          <Grid item xs={12} md={6}>
            <Item>
              <Typography variant="subtitle1">{t('date')}:</Typography>
              <Typography>{formattedDate}</Typography>
            </Item>
          </Grid>
          <Grid item xs={12} md={6}>
            <Item>
              <Typography variant="subtitle1">{t('paymentMethod')}:</Typography>
              <Typography>{transaction.paymentMethod}</Typography>
            </Item>
          </Grid>
          {transaction.description && (
            <Grid item xs={12}>
              <Item>
                <Typography variant="subtitle1">{t('description')}:</Typography>
                <Typography>{transaction.description}</Typography>
              </Item>
            </Grid>
          )}
          {transaction.payerName && (
            <Grid item xs={12} md={6}>
              <Item>
                <Typography variant="subtitle1">{t('payerName')}:</Typography>
                <Typography>{transaction.payerName}</Typography>
              </Item>
            </Grid>
          )}
          {transaction.payerEmail && (
            <Grid item xs={12} md={6}>
              <Item>
                <Typography variant="subtitle1">{t('payerEmail')}:</Typography>
                <Typography>{transaction.payerEmail}</Typography>
              </Item>
            </Grid>
          )}
           {transaction.receiverName && (
            <Grid item xs={12} md={6}>
              <Item>
                <Typography variant="subtitle1">{t('receiverName')}:</Typography>
                <Typography>{transaction.receiverName}</Typography>
              </Item>
            </Grid>
          )}
          {transaction.receiverEmail && (
            <Grid item xs={12} md={6}>
              <Item>
                <Typography variant="subtitle1">{t('receiverEmail')}:</Typography>
                <Typography>{transaction.receiverEmail}</Typography>
              </Item>
            </Grid>
          )}
           {transaction.transactionFee !== undefined && (
            <Grid item xs={12} md={6}>
              <Item>
                <Typography variant="subtitle1">{t('transactionFee')}:</Typography>
                <Typography>{transaction.transactionFee} {transaction.currency}</Typography>
              </Item>
            </Grid>
          )}
           {transaction.notes && (
            <Grid item xs={12}>
              <Item>
                <Typography variant="subtitle1">{t('notes')}:</Typography>
                <Typography>{transaction.notes}</Typography>
              </Item>
            </Grid>
          )}
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" color="primary">
            {t('print')}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default TransactionDetails;