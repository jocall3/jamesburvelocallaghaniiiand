/*
 * Copyright 2024 Monolith AI Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,

 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, 'react';
import {
    useSettlementInstruction,
    useAuth,
    useEventBus,
    useApi,
    useJurisdictionFeatures,
} from '@monolith/core-sdk';
import type {
    SettlementInstruction,
    Party,
    AssetTransfer,
    AuditEvent,
    ComplianceCheckResult,
    UnifiedOntologyType,
} from '@monolith/core-sdk/types';
import {
    Card,
    Spinner,
    Alert,
    Tabs,
    Tab,
    Button,
    Tag,
    JsonViewer,
    Modal,
    Tooltip,
    Icon,
    DataTable,
    KeyValueList,
} from '@monolith/ui-primitives';
import styled from 'styled-components';

// --- STYLED COMPONENTS ---

const ViewContainer = styled(Card)`
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    width: 100%;
    max-width: 1200px;
    overflow: hidden;
    background-color: ${props => props.theme.colors.backgroundSecondary};
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const HeaderTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: ${props => props.theme.colors.textPrimary};
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const ContentArea = styled.div`
    flex-grow: 1;
    overflow-y: auto;
    padding: 1.5rem;
`;

const DisclaimerBanner = styled.div`
    background-color: ${props => props.theme.colors.warningBackground};
    color: ${props => props.theme.colors.warningText};
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    text-align: center;
`;

const Section = styled.div`
    margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.textSecondary};
`;

const ActionPanelContainer = styled.div`
    padding: 1rem 1.5rem;
    border-top: 1px solid ${props => props.theme.colors.border};
    background-color: ${props => props.theme.colors.backgroundPrimary};
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
`;

// --- TYPES ---

export type SettlementInstructionViewMode = 'view' | 'interactive' | 'audit';

export interface SettlementInstructionViewProps {
    instructionId: string;
    onClose?: () => void;
    onUpdate?: (instructionId: string, newStatus: string) => void;
    mode?: SettlementInstructionViewMode;
    jurisdiction: string; // e.g., 'EU', 'US-CA', 'GLOBAL'
}

type StatusVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

// --- HELPER COMPONENTS ---

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
    const getVariant = (): StatusVariant => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
            case 'SETTLED':
            case 'APPROVED':
                return 'success';
            case 'PENDING':
            case 'IN_PROGRESS':
                return 'info';
            case 'FAILED':
            case 'REJECTED':
                return 'danger';
            case 'REQUIRES_REVIEW':
            case 'FLAGGED':
                return 'warning';
            default:
                return 'neutral';
        }
    };
    return <Tag variant={getVariant()}>{status}</Tag>;
};

const PartyDetail: React.FC<{ party: Party; title: string }> = ({ party, title }) => (
    <Section>
        <SectionTitle>{title}</SectionTitle>
        <KeyValueList
            data={{
                'Party ID': party.id,
                'Name': party.name,
                'Role': party.role,
                'Account ID': party.accountId,
                'Jurisdiction': party.jurisdiction,
            }}
        />
    </Section>
);

// --- TAB PANEL COMPONENTS ---

const SummaryPanel: React.FC<{ instruction: SettlementInstruction }> = ({ instruction }) => (
    <div>
        <Section>
            <SectionTitle>Core Details</SectionTitle>
            <KeyValueList
                data={{
                    'Instruction ID': instruction.id,
                    'Correlation ID': instruction.correlationId,
                    'Status': <StatusIndicator status={instruction.status} />,
                    'Created At': new Date(instruction.createdAt).toLocaleString(),
                    'Last Updated': new Date(instruction.updatedAt).toLocaleString(),
                    'Settlement Type': instruction.settlementType,
                    'Priority': instruction.priority,
                }}
            />
        </Section>
        <Section>
            <SectionTitle>Financial Summary</SectionTitle>
            <KeyValueList
                data={{
                    'Total Value': `${instruction.totalValue.amount} ${instruction.totalValue.currency}`,
                    'Net Settlement Amount': `${instruction.netSettlementAmount.amount} ${instruction.netSettlementAmount.currency}`,
                    'Fees': `${instruction.fees.amount} ${instruction.fees.currency}`,
                }}
            />
        </Section>
    </div>
);

const PartiesPanel: React.FC<{ instruction: SettlementInstruction }> = ({ instruction }) => (
    <div>
        <PartyDetail party={instruction.sourceParty} title="Source Party" />
        <PartyDetail party={instruction.destinationParty} title="Destination Party" />
        {instruction.intermediaries && instruction.intermediaries.length > 0 && (
            <Section>
                <SectionTitle>Intermediaries</SectionTitle>
                {instruction.intermediaries.map((p, i) => (
                    <PartyDetail key={i} party={p} title={`Intermediary ${i + 1}`} />
                ))}
            </Section>
        )}
    </div>
);

const AssetTransferPanel: React.FC<{ transfers: AssetTransfer[] }> = ({ transfers }) => (
    <Section>
        <SectionTitle>Asset Transfers ({transfers.length})</SectionTitle>
        <DataTable
            columns={[
                { key: 'assetId', header: 'Asset ID' },
                { key: 'type', header: 'Type' },
                { key: 'quantity', header: 'Quantity' },
                { key: 'unit', header: 'Unit' },
                { key: 'description', header: 'Description' },
            ]}
            data={transfers.map(t => ({
                ...t,
                quantity: t.quantity.toString(),
            }))}
        />
    </Section>
);

const ExecutionLogPanel: React.FC<{ events: AuditEvent[] }> = ({ events }) => (
    <Section>
        <SectionTitle>Execution Log</SectionTitle>
        <DataTable
            columns={[
                { key: 'timestamp', header: 'Timestamp' },
                { key: 'event', header: 'Event' },
                { key: 'actor', header: 'Actor' },
                { key: 'details', header: 'Details' },
            ]}
            data={events.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp).toLocaleString(),
                details: JSON.stringify(e.details),
            }))}
        />
    </Section>
);

const CompliancePanel: React.FC<{ checks: ComplianceCheckResult[] }> = ({ checks }) => (
    <Section>
        <SectionTitle>Compliance & Risk Analysis</SectionTitle>
        {checks.map((check, index) => (
            <Card key={index} style={{ marginBottom: '1rem' }}>
                <Header>
                    <HeaderTitle>{check.checkName}</HeaderTitle>
                    <StatusIndicator status={check.status} />
                </Header>
                <div style={{ padding: '1rem' }}>
                    <KeyValueList
                        data={{
                            'Check ID': check.checkId,
                            'Provider': check.provider,
                            'Timestamp': new Date(check.timestamp).toLocaleString(),
                            'Summary': check.summary,
                        }}
                    />
                    {check.details && (
                        <>
                            <h4>Details:</h4>
                            <JsonViewer data={check.details} />
                        </>
                    )}
                </div>
            </Card>
        ))}
    </Section>
);

const RawDataPanel: React.FC<{ instruction: SettlementInstruction }> = ({ instruction }) => (
    <Section>
        <SectionTitle>Raw Instruction Data</SectionTitle>
        <JsonViewer data={instruction} />
    </Section>
);

// --- ACTION PANEL ---

const ActionPanel: React.FC<{
    instruction: SettlementInstruction;
    onUpdate?: (instructionId: string, newStatus: string) => void;
    jurisdiction: string;
}> = ({ instruction, onUpdate, jurisdiction }) => {
    const { user, hasPermission } = useAuth();
    const { publish } = useEventBus();
    const api = useApi();
    const { isFeatureEnabled } = useJurisdictionFeatures(jurisdiction);
    const [isConfirming, setIsConfirming] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const canApprove = hasPermission('settlement:approve') && isFeatureEnabled('MANUAL_APPROVAL');
    const canReject = hasPermission('settlement:reject') && isFeatureEnabled('MANUAL_REJECTION');
    const canEscalate = hasPermission('settlement:escalate');

    const handleAction = async (action: 'approve' | 'reject' | 'escalate') => {
        setIsLoading(true);
        try {
            const response = await api.post(`/settlement/instructions/${instruction.id}/actions`, {
                action,
                actor: user.id,
                reason: `Manual action taken by ${user.email}`,
            });

            publish('settlement.instruction.updated', {
                instructionId: instruction.id,
                actor: user.id,
                action,
            });

            if (onUpdate) {
                onUpdate(instruction.id, response.data.newStatus);
            }
        } catch (error) {
            console.error(`Failed to ${action} instruction:`, error);
            // Show error toast to user
        } finally {
            setIsLoading(false);
            setIsConfirming(null);
        }
    };

    const renderConfirmModal = () => (
        <Modal
            isOpen={!!isConfirming}
            onClose={() => setIsConfirming(null)}
            title={`Confirm ${isConfirming}`}
        >
            <p>Are you sure you want to {isConfirming} this settlement instruction? This action will be logged in the audit trail.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <Button variant="secondary" onClick={() => setIsConfirming(null)} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    variant={isConfirming === 'reject' ? 'danger' : 'primary'}
                    onClick={() => handleAction(isConfirming as any)}
                    isLoading={isLoading}
                >
                    Confirm {isConfirming}
                </Button>
            </div>
        </Modal>
    );

    return (
        <ActionPanelContainer>
            {renderConfirmModal()}
            <Tooltip content="Escalate for senior review.">
                <Button
                    variant="secondary"
                    onClick={() => setIsConfirming('escalate')}
                    disabled={!canEscalate || isLoading}
                >
                    <Icon name="shield-up" /> Escalate
                </Button>
            </Tooltip>
            <Tooltip content="Reject this settlement instruction. This is a final action.">
                <Button
                    variant="danger"
                    onClick={() => setIsConfirming('reject')}
                    disabled={!canReject || isLoading}
                >
                    <Icon name="x-circle" /> Reject
                </Button>
            </Tooltip>
            <Tooltip content="Approve this settlement instruction for execution.">
                <Button
                    variant="primary"
                    onClick={() => setIsConfirming('approve')}
                    disabled={!canApprove || isLoading}
                >
                    <Icon name="check-circle" /> Approve
                </Button>
            </Tooltip>
        </ActionPanelContainer>
    );
};

// --- MAIN COMPONENT ---

export const SettlementInstructionView: React.FC<SettlementInstructionViewProps> = ({
    instructionId,
    onClose,
    onUpdate,
    mode = 'view',
    jurisdiction,
}) => {
    const { data: instruction, isLoading, error, refetch } = useSettlementInstruction(instructionId);
    const [activeTab, setActiveTab] = React.useState('summary');

    const handleUpdate = (id: string, newStatus: string) => {
        refetch();
        if (onUpdate) {
            onUpdate(id, newStatus);
        }
    };

    if (isLoading) {
        return (
            <ViewContainer>
                <LoadingContainer>
                    <Spinner size="large" />
                </LoadingContainer>
            </ViewContainer>
        );
    }

    if (error) {
        return (
            <ViewContainer>
                <Alert variant="danger" title="Failed to load instruction">
                    {error.message}
                </Alert>
            </ViewContainer>
        );
    }

    if (!instruction) {
        return (
            <ViewContainer>
                <Alert variant="warning" title="Not Found">
                    Settlement instruction with ID {instructionId} could not be found.
                </Alert>
            </ViewContainer>
        );
    }

    const isInteractive = mode === 'interactive' && ['PENDING', 'REQUIRES_REVIEW', 'FLAGGED'].includes(instruction.status.toUpperCase());

    return (
        <ViewContainer>
            <DisclaimerBanner>
                <Icon name="alert-triangle" /> This information is for operational purposes only and does not constitute financial advice. All actions are audited.
            </DisclaimerBanner>
            <Header>
                <HeaderTitle>
                    Settlement Instruction: {instruction.id}
                </HeaderTitle>
                <HeaderActions>
                    <StatusIndicator status={instruction.status} />
                    {onClose && <Button variant="ghost" onClick={onClose}><Icon name="x" /></Button>}
                </HeaderActions>
            </Header>
            <ContentArea>
                <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                    <Tab eventKey="summary" title="Summary">
                        <SummaryPanel instruction={instruction} />
                    </Tab>
                    <Tab eventKey="parties" title="Parties">
                        <PartiesPanel instruction={instruction} />
                    </Tab>
                    <Tab eventKey="assets" title="Asset Transfers">
                        <AssetTransferPanel transfers={instruction.assetTransfers} />
                    </Tab>
                    <Tab eventKey="log" title="Execution Log">
                        <ExecutionLogPanel events={instruction.auditTrail} />
                    </Tab>
                    <Tab eventKey="compliance" title="Compliance">
                        <CompliancePanel checks={instruction.complianceChecks} />
                    </Tab>
                    <Tab eventKey="raw" title="Raw Data">
                        <RawDataPanel instruction={instruction} />
                    </Tab>
                </Tabs>
            </ContentArea>
            {isInteractive && (
                <ActionPanel
                    instruction={instruction}
                    onUpdate={handleUpdate}
                    jurisdiction={jurisdiction}
                />
            )}
        </ViewContainer>
    );
};

/*
agent_metadata:
  purpose: "Provides a detailed, interactive user interface for viewing, auditing, and acting upon a single settlement instruction. It serves as a critical human-in-the-loop checkpoint for automated financial or data settlement workflows."
  dependencies:
    - "@monolith/core-sdk": For data fetching hooks (useSettlementInstruction), authentication (useAuth), event publishing (useEventBus), API calls (useApi), and jurisdictional feature flagging (useJurisdictionFeatures).
    - "@monolith/core-sdk/types": For shared data contracts like SettlementInstruction, Party, AuditEvent.
    - "@monolith/ui-primitives": For all visual components (Card, Button, Tabs, etc.).
    - "react": Core UI library.
    - "styled-components": For styling.
  invalidation_conditions:
    - "A major breaking change in the SettlementInstruction data model from the unified ontology."
    - "Deprecation of the v1 settlement API endpoint that useSettlementInstruction hook relies on."
    - "Significant changes to the design system in @monolith/ui-primitives requiring a UI rewrite."
  adjacent_apps:
    - "APP_37_Governance_AuditTrailEngine": This UI component directly visualizes the audit trail generated by the audit engine.
    - "APP_45_Compliance_PolicyValidator": The results from the policy validator are displayed in the 'Compliance' tab.
    - "APP_11_Billing_TransactionProcessor": This UI is often the final manual approval step before a transaction is sent to the processor.
    - "APP_14_Agents_MultiModelOrchestrator": The orchestrator may generate the settlement instructions that are viewed and managed through this component.
*/