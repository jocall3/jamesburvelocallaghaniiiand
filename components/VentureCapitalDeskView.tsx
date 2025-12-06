
import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab } from 'react-bootstrap';
import { DealFlow } from './DealFlow';
import { InvestmentForm } from './InvestmentForm';
import { PortfolioCompanyList } from './PortfolioCompanyList';
import { PortfolioCompanyDetails } from './PortfolioCompanyDetails';

const VentureCapitalDeskView = () => {
    const [activeTab, setActiveTab] = useState('dealFlow');
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null); // Assuming string is company ID

    const handleSelectCompany = (companyId: string) => {
        setSelectedCompany(companyId);
        setActiveTab('portfolioCompaniesDetails');
    };

    const handleBackToPortfolio = () => {
        setSelectedCompany(null);
        setActiveTab('portfolioCompanies');
    }


    return (
        <Container fluid className="mt-3">
            <Row>
                <Col>
                    <h1>Venture Capital Desk</h1>
                    <p>Manage investments, track deal flow, and oversee portfolio companies.</p>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(tab) => setActiveTab(tab || 'dealFlow')}
                        id="vc-desk-tabs"
                        className="mb-3"
                    >
                        <Tab eventKey="dealFlow" title="Deal Flow">
                            <DealFlow />
                        </Tab>
                        <Tab eventKey="investmentForm" title="New Investment">
                            <InvestmentForm />
                        </Tab>
                        {selectedCompany ? (
                            <Tab eventKey="portfolioCompaniesDetails" title="Portfolio Company Details">
                                <Button onClick={handleBackToPortfolio} variant="link">Back to Portfolio</Button>
                                <PortfolioCompanyDetails companyId={selectedCompany} />
                            </Tab>
                        ) : (
                            <Tab eventKey="portfolioCompanies" title="Portfolio Companies">
                                <PortfolioCompanyList onSelectCompany={handleSelectCompany} />
                            </Tab>
                        )}

                    </Tabs>
                </Col>
            </Row>
        </Container>
    );
};

export default VentureCapitalDeskView;
