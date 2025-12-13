import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  DataTable,
  TextField,
  Button,
  Icon,
  Tabs,
  useToast,
  Modal,
  FormLayout,
  Select,
} from '@shopify/polaris';
import {
  CurrencyMinor,
  ArrowRightMinor,
  RefreshMinor,
  AddMajor,
} from '@shopify/polaris-icons';

// Mock data and API calls for demonstration
const mockExchangeRates = {
  USD: {
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.5,
    CAD: 1.35,
  },
  EUR: {
    USD: 1.09,
    GBP: 0.86,
    JPY: 163.5,
    CAD: 1.47,
  },
  GBP: {
    USD: 1.27,
    EUR: 1.16,
    JPY: 189.5,
    CAD: 1.71,
  },
  JPY: {
    USD: 0.0066,
    EUR: 0.0061,
    GBP: 0.0053,
    CAD: 0.0089,
  },
  CAD: {
    USD: 0.74,
    EUR: 0.68,
    GBP: 0.58,
    JPY: 112.5,
  },
};

interface Balance {
  currency: string;
  amount: number;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

const mockBalances: Balance[] = [
  { currency: 'USD', amount: 1500.75 },
  { currency: 'EUR', amount: 850.20 },
  { currency: 'GBP', amount: 500.00 },
];

const fetchExchangeRates = async (): Promise<ExchangeRate[]> => {
  // In a real app, this would fetch from a reliable API
  return new Promise((resolve) => {
    setTimeout(() => {
      const rates: ExchangeRate[] = [];
      for (const fromCurrency in mockExchangeRates) {
        for (const toCurrency in mockExchangeRates[fromCurrency]) {
          rates.push({
            from: fromCurrency,
            to: toCurrency,
            rate: mockExchangeRates[fromCurrency][toCurrency],
          });
        }
      }
      resolve(rates);
    }, 500);
  });
};

const fetchBalances = async (): Promise<Balance[]> => {
  // In a real app, this would fetch from Stripe or a backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockBalances);
    }, 300);
  });
};

const CurrencyExchangePage: React.FC = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingRates, setLoadingRates] = useState(true);
  const [activeTab, setActiveTab] = useState('balances');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionDetails, setConversionDetails] = useState({
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    amountToConvert: '',
    convertedAmount: '',
  });
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const [newBalanceDetails, setNewBalanceDetails] = useState({
    currency: 'USD',
    amount: '',
  });

  const toastMarkup = useToast();

  const handleTabChange = (selectedTabIndex: number) => {
    setActiveTab(
      selectedTabIndex === 0 ? 'balances' : selectedTabIndex === 1 ? 'rates' : 'convert'
    );
  };

  const loadData = async () => {
    setLoadingBalances(true);
    setLoadingRates(true);
    try {
      const fetchedBalances = await fetchBalances();
      setBalances(fetchedBalances);
      setLoadingBalances(false);

      const fetchedRates = await fetchExchangeRates();
      setExchangeRates(fetchedRates);
      setLoadingRates(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toastMarkup.dispatch({
        content: 'Failed to load data. Please try again.',
        duration: 5000,
        error: true,
      });
      setLoadingBalances(false);
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
    toastMarkup.dispatch({
      content: 'Data refreshed.',
      duration: 3000,
    });
  };

  const handleConvertClick = () => {
    setIsConverting(true);
  };

  const handleCloseConversionModal = () => {
    setIsConverting(false);
    setConversionDetails({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      amountToConvert: '',
      convertedAmount: '',
    });
  };

  const handleConversionInputChange = (field: string, value: string) => {
    setConversionDetails((prev) => ({ ...prev, [field]: value }));
  };

  const getRate = (from: string, to: string): number | null => {
    const rateEntry = exchangeRates.find(
      (rate) => rate.from === from && rate.to === to
    );
    return rateEntry ? rateEntry.rate : null;
  };

  useEffect(() => {
    if (conversionDetails.amountToConvert && conversionDetails.fromCurrency && conversionDetails.toCurrency) {
      const rate = getRate(conversionDetails.fromCurrency, conversionDetails.toCurrency);
      if (rate !== null) {
        const amount = parseFloat(conversionDetails.amountToConvert);
        if (!isNaN(amount)) {
          const converted = amount * rate;
          setConversionDetails((prev) => ({
            ...prev,
            convertedAmount: converted.toFixed(2),
          }));
        } else {
          setConversionDetails((prev) => ({ ...prev, convertedAmount: '' }));
        }
      } else {
        setConversionDetails((prev) => ({ ...prev, convertedAmount: 'N/A' }));
      }
    } else {
      setConversionDetails((prev) => ({ ...prev, convertedAmount: '' }));
    }
  }, [conversionDetails.amountToConvert, conversionDetails.fromCurrency, conversionDetails.toCurrency, exchangeRates]);

  const performConversion = () => {
    if (!conversionDetails.amountToConvert || !conversionDetails.convertedAmount || conversionDetails.convertedAmount === 'N/A') {
      toastMarkup.dispatch({
        content: 'Please enter a valid amount and ensure a rate is available.',
        duration: 4000,
        error: true,
      });
      return;
    }

    const amountToConvert = parseFloat(conversionDetails.amountToConvert);
    const convertedAmount = parseFloat(conversionDetails.convertedAmount);

    // In a real app, this would involve Stripe API calls to debit one balance and credit another.
    // For demonstration, we'll just update the mock balances and show a success toast.
    const updatedBalances = balances.map((balance) => {
      if (balance.currency === conversionDetails.fromCurrency) {
        return { ...balance, amount: balance.amount - amountToConvert };
      }
      if (balance.currency === conversionDetails.toCurrency) {
        return { ...balance, amount: balance.amount + convertedAmount };
      }
      return balance;
    });

    setBalances(updatedBalances);
    toastMarkup.dispatch({
      content: `Successfully converted ${amountToConvert.toFixed(2)} ${conversionDetails.fromCurrency} to ${convertedAmount.toFixed(2)} ${conversionDetails.toCurrency}.`,
      duration: 5000,
    });
    handleCloseConversionModal();
  };

  const handleAddBalanceClick = () => {
    setIsAddingBalance(true);
  };

  const handleCloseAddBalanceModal = () => {
    setIsAddingBalance(false);
    setNewBalanceDetails({ currency: 'USD', amount: '' });
  };

  const handleNewBalanceInputChange = (field: string, value: string) => {
    setNewBalanceDetails((prev) => ({ ...prev, [field]: value }));
  };

  const addNewBalance = () => {
    const amount = parseFloat(newBalanceDetails.amount);
    if (!newBalanceDetails.currency || isNaN(amount) || amount <= 0) {
      toastMarkup.dispatch({
        content: 'Please enter a valid currency and a positive amount.',
        duration: 4000,
        error: true,
      });
      return;
    }

    // Check if balance for this currency already exists
    const existingBalance = balances.find(b => b.currency === newBalanceDetails.currency);
    if (existingBalance) {
      const updatedBalances = balances.map(b =>
        b.currency === newBalanceDetails.currency ? { ...b, amount: b.amount + amount } : b
      );
      setBalances(updatedBalances);
    } else {
      setBalances([...balances, { currency: newBalanceDetails.currency, amount }]);
    }

    toastMarkup.dispatch({
      content: `Added ${amount.toFixed(2)} ${newBalanceDetails.currency} to your balances.`,
      duration: 5000,
    });
    handleCloseAddBalanceModal();
  };

  const availableCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD']; // Example list

  const balanceColumns = [
    {
      key: 'currency',
      title: 'Currency',
      content: (item: Balance) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Icon source={CurrencyMinor} color="base" />
          <span style={{ marginLeft: '8px' }}>{item.currency}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      content: (item: Balance) => `$${item.amount.toFixed(2)}`, // Assuming USD as base for display
    },
  ];

  const rateColumns = [
    {
      key: 'from',
      title: 'From',
      content: (item: ExchangeRate) => item.from,
    },
    {
      key: 'to',
      title: 'To',
      content: (item: ExchangeRate) => item.to,
    },
    {
      key: 'rate',
      title: 'Rate',
      content: (item: ExchangeRate) => item.rate.toFixed(4),
    },
  ];

  const tabs = [
    { id: 'balances', content: 'Balances', accessibilityLabel: 'Balances tab' },
    { id: 'rates', content: 'Exchange Rates', accessibilityLabel: 'Exchange Rates tab' },
    { id: 'convert', content: 'Convert Currency', accessibilityLabel: 'Convert Currency tab' },
  ];

  return (
    <Page
      title="Global Payments - Currency Management"
      primaryAction={
        <Button icon={RefreshMinor} onClick={handleRefresh} loading={loadingBalances || loadingRates}>
          Refresh
        </Button>
      }
      secondaryActions={[
        <Button icon={AddMajor} onClick={handleAddBalanceClick}>
          Add Balance
        </Button>,
        <Button icon={ArrowRightMinor} onClick={handleConvertClick} disabled={balances.length === 0}>
          Convert
        </Button>,
      ]}
    >
      {toastMarkup}
      <Tabs tabs={tabs} selected={tabs.findIndex(tab => tab.id === activeTab)} onSelect={handleTabChange}>
        {activeTab === 'balances' && (
          <Card sectioned>
            <DataTable
              columns={balanceColumns}
              rows={balances}
              loading={loadingBalances}
              emptyState="No balances found. Add a new balance to get started."
            />
          </Card>
        )}

        {activeTab === 'rates' && (
          <Card sectioned>
            <DataTable
              columns={rateColumns}
              rows={exchangeRates}
              loading={loadingRates}
              emptyState="No exchange rates available. Please refresh or check your connection."
            />
          </Card>
        )}

        {activeTab === 'convert' && (
          <Card sectioned>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <FormLayout>
                <Select
                  label="From Currency"
                  options={balances.map(b => ({ label: b.currency, value: b.currency }))}
                  value={conversionDetails.fromCurrency}
                  onChange={(value) => handleConversionInputChange('fromCurrency', value)}
                />
                <TextField
                  label="Amount to Convert"
                  type="number"
                  value={conversionDetails.amountToConvert}
                  onChange={(value) => handleConversionInputChange('amountToConvert', value)}
                  prefix={conversionDetails.fromCurrency}
                  connectedRight={
                    <Button
                      plain
                      icon={RefreshMinor}
                      onClick={() => {
                        const temp = conversionDetails.fromCurrency;
                        setConversionDetails(prev => ({ ...prev, fromCurrency: prev.toCurrency, toCurrency: temp }));
                      }}
                    />
                  }
                />
                <Icon source={ArrowRightMinor} color="subdued" />
                <Select
                  label="To Currency"
                  options={availableCurrencies.map(c => ({ label: c, value: c }))}
                  value={conversionDetails.toCurrency}
                  onChange={(value) => handleConversionInputChange('toCurrency', value)}
                />
                <TextField
                  label="Converted Amount"
                  value={conversionDetails.convertedAmount}
                  readOnly
                  prefix={conversionDetails.toCurrency}
                />
                <Button primary onClick={performConversion} disabled={!conversionDetails.convertedAmount || conversionDetails.convertedAmount === 'N/A'}>
                  Confirm Conversion
                </Button>
              </FormLayout>
            </div>
          </Card>
        )}
      </Tabs>

      <Modal
        open={isConverting}
        onClose={handleCloseConversionModal}
        title="Currency Conversion"
        primaryAction={{
          content: 'Convert',
          onAction: performConversion,
          disabled: !conversionDetails.convertedAmount || conversionDetails.convertedAmount === 'N/A',
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleCloseConversionModal,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="From Currency"
              options={balances.map(b => ({ label: b.currency, value: b.currency }))}
              value={conversionDetails.fromCurrency}
              onChange={(value) => handleConversionInputChange('fromCurrency', value)}
            />
            <TextField
              label="Amount to Convert"
              type="number"
              value={conversionDetails.amountToConvert}
              onChange={(value) => handleConversionInputChange('amountToConvert', value)}
              prefix={conversionDetails.fromCurrency}
            />
            <Icon source={ArrowRightMinor} color="subdued" />
            <Select
              label="To Currency"
              options={availableCurrencies.map(c => ({ label: c, value: c }))}
              value={conversionDetails.toCurrency}
              onChange={(value) => handleConversionInputChange('toCurrency', value)}
            />
            <TextField
              label="Converted Amount"
              value={conversionDetails.convertedAmount}
              readOnly
              prefix={conversionDetails.toCurrency}
            />
            <p>
              Current rate: 1 {conversionDetails.fromCurrency} = {getRate(conversionDetails.fromCurrency, conversionDetails.toCurrency)?.toFixed(4) ?? 'N/A'} {conversionDetails.toCurrency}
            </p>
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={isAddingBalance}
        onClose={handleCloseAddBalanceModal}
        title="Add New Balance"
        primaryAction={{
          content: 'Add Balance',
          onAction: addNewBalance,
          disabled: !newBalanceDetails.amount || !newBalanceDetails.currency,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleCloseAddBalanceModal,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Currency"
              options={availableCurrencies.map(c => ({ label: c, value: c }))}
              value={newBalanceDetails.currency}
              onChange={(value) => handleNewBalanceInputChange('currency', value)}
            />
            <TextField
              label="Initial Amount"
              type="number"
              value={newBalanceDetails.amount}
              onChange={(value) => handleNewBalanceInputChange('amount', value)}
              prefix={newBalanceDetails.currency}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default CurrencyExchangePage;