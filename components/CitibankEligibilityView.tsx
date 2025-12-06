
import React, { useState, useEffect, useCallback } from 'react';
import {
  useMoneyMovement,
} from './MoneyMovementContext';
import {
    BillPaymentAccountPayeeEligibilityResponse,
    SourceAccounts,
    BillPaymentPayeeSourceAccountCombinations
} from './CitibankMoneyMovementSDK';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

// Shim for types used in the original file that map to the SDK
type SourceAccountAndPayee = any; 

const CitibankEligibilityView: React.FC = () => {
  const { api, accessToken, uuid } = useMoneyMovement();
  const [eligibilityData, setEligibilityData] = useState<BillPaymentAccountPayeeEligibilityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEligibility = useCallback(async () => {
    if (!api || !accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.retrieveDestinationSourceAccountBillPay(
        accessToken,
        uuid
      );
      setEligibilityData(response);
    } catch (err: any) {
      console.error("Error fetching eligibility data:", err);
      setError(err.message || "Failed to fetch eligibility data.");
    } finally {
      setLoading(false);
    }
  }, [api, accessToken, uuid]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  // Helper to display source accounts nicely
  const sourceAccountsBodyTemplate = (rowData: SourceAccounts) => {
      return (
          <div className="flex flex-col">
            <span className="font-bold text-gray-100">{rowData.productName} ({rowData.displaySourceAccountNumber})</span>
            <span className="text-sm text-gray-400">Balance: {rowData.availableBalance} {rowData.sourceAccountCurrencyCode}</span>
          </div>
      )
  }

  // Helper to display Payees
  const payeesBodyTemplate = (rowData: SourceAccounts) => {
      if(!rowData.payeeSourceAccountCombinations) return <span className="text-gray-500">None</span>;
      return (
          <div className="flex flex-col gap-1">
              {rowData.payeeSourceAccountCombinations.map((payee, i) => (
                  <span key={i} className="text-xs bg-gray-700 p-1 rounded text-gray-300">
                      {payee.payeeNickName} (...{payee.displayPayeeAccountNumber.slice(-4)})
                  </span>
              ))}
          </div>
      )
  }

  return (
    <Card title="Payment Eligibility Check" className="m-4 bg-gray-900 text-white border border-gray-700">
      <div className="mb-4">
        <p className="text-gray-400">This module checks which of your source accounts are eligible to pay registered billers.</p>
        <Button label="Refresh Eligibility" icon="pi pi-refresh" className="p-button-sm mt-2" onClick={fetchEligibility} loading={loading} />
      </div>

      {error && (
        <div className="p-4 mb-3 text-red-300 bg-red-900/50 border border-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />}

      {!loading && eligibilityData?.sourceAccounts && (
        <DataTable value={eligibilityData.sourceAccounts} responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="No eligible source accounts found.">
            <Column header="Eligible Source Account" body={sourceAccountsBodyTemplate} style={{ minWidth: '250px' }} />
            <Column header="Eligible Payees for this Account" body={payeesBodyTemplate} style={{ minWidth: '250px' }} />
        </DataTable>
      )}
      
      {!loading && !error && (!eligibilityData?.sourceAccounts || eligibilityData.sourceAccounts.length === 0) && (
          <div className="p-4 text-center text-gray-500">No eligibility data found.</div>
      )}
    </Card>
  );
};

export default CitibankEligibilityView;
