/*
 * Copyright 2024-present, The AI Company. All rights reserved.
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * DISCLAIMER: This software is provided "as is", without warranty of any kind,
 * express or implied, including but not limited to the warranties of
 * merchantability, fitness for a particular purpose and non-infringement.
 * In no event shall the authors or copyright holders be liable for any claim,
 * damages or other liability, whether in an action of contract, tort or
 * otherwise, arising from, out of or in connection with the software or the
 * use or other dealings in the software.
 */

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './primitives/Card';
import { KeyValueDisplay } from './KeyValueDisplay';
import { StatusBadge, StatusType } from './StatusBadge';
import { Timestamp } from './Timestamp';
import { DataTable } from './DataTable';
import { SectionHeader } from './SectionHeader';
import { Alert, AlertDescription, AlertTitle } from './primitives/Alert';
import { DollarSign, AlertTriangle, CheckCircle, Cpu } from 'lucide-react';

export type TradeStatus = 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED' | 'PARTIALLY_FILLED';
export type TradeSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type ComplianceStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'PENDING';

export interface TradeInstrument {
  symbol: string;
  name: string;
  assetClass: 'EQUITY' | 'OPTION' | 'CRYPTO' | 'FOREX' | 'FUTURE';
  isin?: string;
}

export interface TradeFee {
  commission: number;
  exchangeFee: number;
  regulatoryFee: number;
  clearingFee: number;
}

export interface TradeLeg {
  legId: string;
  instrument: TradeInstrument;
  side: TradeSide;
  quantity: number;
  price: number;
  status: TradeStatus;
}

export interface ExecutionModelInfo {
  name: string;
  version: string;
  confidenceScore: number;
  decisionRationale: string;
}

export interface ComplianceCheckResult {
  checkName: string;
  status: ComplianceStatus;
  details: string;
}

export interface TradeDetailsProps {
  tradeId: string;
  status: TradeStatus;
  instrument: TradeInstrument;
  side: TradeSide;
  quantity: number;
  price: number;
  orderType: OrderType;
  executedAt?: Date | string;
  submittedAt: Date | string;
  expiresAt?: Date | string;
  venue: string;
  currency: string;
  fees: TradeFee;
  notes?: string;
  legs?: TradeLeg[];
  executionModel?: ExecutionModelInfo;
  complianceChecks?: ComplianceCheckResult[];
  className?: string;
}

const getStatusType = (status: TradeStatus): StatusType => {
  switch (status) {
    case 'EXECUTED': return 'success';
    case 'FAILED': return 'error';
    case 'CANCELLED': return 'warning';
    case 'PENDING': return 'info';
    case 'PARTIALLY_FILLED': return 'progress';
    default: return 'default';
  }
};

const getComplianceStatusType = (status: ComplianceStatus): StatusType => {
    switch (status) {
      case 'PASSED': return 'success';
      case 'FAILED': return 'error';
      case 'WARNING': return 'warning';
      case 'PENDING': return 'info';
      default: return 'default';
    }
  };

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * A comprehensive component for displaying detailed information about a financial trade.
 * It is designed to be used within financial dashboards, audit trails, or trade review systems.
 */
export const TradeDetails: React.FC<TradeDetailsProps> = ({
  tradeId,
  status,
  instrument,
  side,
  quantity,
  price,
  orderType,
  executedAt,
  submittedAt,
  expiresAt,
  venue,
  currency,
  fees,
  notes,
  legs,
  executionModel,
  complianceChecks,
  className = '',
}) => {
  const totalValue = quantity * price;
  const totalFees = fees.commission + fees.exchangeFee + fees.regulatoryFee + fees.clearingFee;

  const legColumns = [
    { accessor: 'instrument.symbol', header: 'Symbol' },
    { accessor: 'side', header: 'Side' },
    { accessor: 'quantity', header: 'Quantity' },
    { accessor: 'price', header: 'Price' },
    { accessor: 'status', header: 'Status' },
  ];

  const complianceColumns = [
    { accessor: 'checkName', header: 'Check' },
    { accessor: 'status', header: 'Status', cell: (status: ComplianceStatus) => <StatusBadge status={status} type={getComplianceStatusType(status)} /> },
    { accessor: 'details', header: 'Details' },
  ];

  const overallComplianceStatus: ComplianceStatus = complianceChecks?.some(c => c.status === 'FAILED') ? 'FAILED'
    : complianceChecks?.some(c => c.status === 'WARNING') ? 'WARNING'
    : complianceChecks?.every(c => c.status === 'PASSED') ? 'PASSED'
    : 'PENDING';

  const getComplianceAlert = () => {
    switch(overallComplianceStatus) {
        case 'FAILED':
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Compliance Failure</AlertTitle>
                    <AlertDescription>One or more compliance checks failed. Review details below.</AlertDescription>
                </Alert>
            );
        case 'WARNING':
            return (
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Compliance Warning</AlertTitle>
                    <AlertDescription>Potential compliance issues detected. Manual review may be required.</AlertDescription>
                </Alert>
            );
        case 'PASSED':
            return (
                <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Compliance Passed</AlertTitle>
                    <AlertDescription>All automated compliance checks passed successfully.</AlertDescription>
                </Alert>
            );
        default:
            return null;
    }
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">
              Trade Details: {instrument.symbol}
            </CardTitle>
            <CardDescription>ID: {tradeId}</CardDescription>
          </div>
          <StatusBadge status={status} type={getStatusType(status)} size="lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {complianceChecks && getComplianceAlert()}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SectionHeader title="Order Summary" />
            <div className="grid grid-cols-2 gap-4">
              <KeyValueDisplay label="Instrument" value={`${instrument.name} (${instrument.symbol})`} />
              <KeyValueDisplay label="Asset Class" value={instrument.assetClass} />
              <KeyValueDisplay label="Side" value={side} valueClassName={side === 'BUY' ? 'text-green-600' : 'text-red-600'} />
              <KeyValueDisplay label="Order Type" value={orderType} />
              <KeyValueDisplay label="Quantity" value={quantity.toLocaleString()} />
              <KeyValueDisplay label="Price" value={formatCurrency(price, currency)} />
              <KeyValueDisplay label="Total Value" value={formatCurrency(totalValue, currency)} isEmphasized />
              <KeyValueDisplay label="Venue" value={venue} />
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeader title="Timestamps" />
            <div className="space-y-2">
              <KeyValueDisplay label="Submitted">
                <Timestamp date={submittedAt} />
              </KeyValueDisplay>
              {executedAt && (
                <KeyValueDisplay label="Executed">
                  <Timestamp date={executedAt} />
                </KeyValueDisplay>
              )}
              {expiresAt && (
                <KeyValueDisplay label="Expires">
                  <Timestamp date={expiresAt} />
                </KeyValueDisplay>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <SectionHeader title="Financials" icon={<DollarSign className="h-5 w-5" />} />
                <div className="space-y-2">
                    <KeyValueDisplay label="Commission" value={formatCurrency(fees.commission, currency)} />
                    <KeyValueDisplay label="Exchange Fee" value={formatCurrency(fees.exchangeFee, currency)} />
                    <KeyValueDisplay label="Regulatory Fee" value={formatCurrency(fees.regulatoryFee, currency)} />
                    <KeyValueDisplay label="Clearing Fee" value={formatCurrency(fees.clearingFee, currency)} />
                    <hr className="my-2 border-dashed" />
                    <KeyValueDisplay label="Total Fees" value={formatCurrency(totalFees, currency)} isEmphasized />
                </div>
            </div>
            {executionModel && (
                <div className="space-y-4">
                    <SectionHeader title="AI Execution Model" icon={<Cpu className="h-5 w-5" />} />
                    <div className="space-y-2">
                        <KeyValueDisplay label="Model Name" value={executionModel.name} />
                        <KeyValueDisplay label="Version" value={executionModel.version} />
                        <KeyValueDisplay label="Confidence" value={`${(executionModel.confidenceScore * 100).toFixed(2)}%`} />
                        <KeyValueDisplay label="Rationale" value={executionModel.decisionRationale} layout="vertical" />
                    </div>
                </div>
            )}
        </div>

        {legs && legs.length > 0 && (
          <div>
            <SectionHeader title="Complex Order Legs" />
            <DataTable columns={legColumns} data={legs} />
          </div>
        )}

        {complianceChecks && complianceChecks.length > 0 && (
            <div>
                <SectionHeader title="Compliance Checks" icon={<AlertTriangle className="h-5 w-5" />} />
                <DataTable columns={complianceColumns} data={complianceChecks} />
            </div>
        )}

        {notes && (
          <div>
            <SectionHeader title="Notes" />
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};