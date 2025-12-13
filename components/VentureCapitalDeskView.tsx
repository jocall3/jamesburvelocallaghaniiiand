```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Form, Table, Navbar, Nav, NavDropdown, ListGroup, ProgressBar, Alert, Breadcrumb, InputGroup, FormControl, Dropdown, DropdownButton, OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
import { DealFlow } from './DealFlow';
import { InvestmentForm } from './InvestmentForm';
import { PortfolioCompanyList } from './PortfolioCompanyList';
import { PortfolioCompanyDetails } from './PortfolioCompanyDetails';

// The James Burvel O'Callaghan III Code - Venture Capital Desk View

const VentureCapitalDeskView = () => {

    // A. State Variables
    const [A1_activeTab, A2_setActiveTab] = useState('A3_dealFlow');
    const [A4_selectedCompany, A5_setSelectedCompany] = useState<string | null>(null);
    const [A6_searchTerm, A7_setSearchTerm] = useState('');
    const [A8_showSettings, A9_setShowSettings] = useState(false);
    const [AA_dealFlowData, AB_setDealFlowData] = useState([
        { id: '1', companyName: 'AlphaTech Solutions', stage: 'Seed', industry: 'Software', location: 'San Francisco', investmentNeeded: 500000, status: 'Active' },
        { id: '2', companyName: 'Beta Innovations', stage: 'Series A', industry: 'Biotech', location: 'Boston', investmentNeeded: 2000000, status: 'Review' },
        { id: '3', companyName: 'Gamma Dynamics', stage: 'Series B', industry: 'AI', location: 'New York', investmentNeeded: 5000000, status: 'Approved' },
    ]);
    const [AC_portfolioCompanies, AD_setPortfolioCompanies] = useState([
        { id: 'pc1', name: 'Delta Corp', industry: 'Fintech', location: 'London', valuation: 10000000 },
        { id: 'pc2', name: 'Epsilon Ventures', industry: 'Healthcare', location: 'Chicago', valuation: 5000000 },
    ]);
    const [AE_investmentAmount, AF_setInvestmentAmount] = useState(100000);
    const [AG_riskTolerance, AH_setRiskTolerance] = useState('Medium');
    const [AI_showNotifications, AJ_setShowNotifications] = useState(false);
    const [AK_notifications, AL_setNotifications] = useState([
        { id: 'n1', message: 'New deal flow: AlphaTech Solutions', type: 'info' },
        { id: 'n2', message: 'Portfolio company Delta Corp valuation increased', type: 'success' },
    ]);
    const [AM_userProfile, AN_setUserProfile] = useState({ name: 'John Doe', title: 'Investment Manager', email: 'john.doe@example.com' });
    const [AO_marketData, AP_setMarketData] = useState({ dow: 34000, nasdaq: 14000, sp500: 4400 });

    // B. Handlers and Callbacks
    const B1_handleSelectCompany = useCallback((companyId: string) => { A5_setSelectedCompany(companyId); A2_setActiveTab('B2_portfolioCompaniesDetails'); }, [A5_setSelectedCompany, A2_setActiveTab]);
    const B3_handleBackToPortfolio = useCallback(() => { A5_setSelectedCompany(null); A2_setActiveTab('B4_portfolioCompanies'); }, [A5_setSelectedCompany, A2_setActiveTab]);
    const B5_handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { A7_setSearchTerm(e.target.value); }, [A7_setSearchTerm]);
    const B6_handleSettingsToggle = useCallback(() => { A9_setShowSettings(!A8_showSettings); }, [A8_showSettings, A9_setShowSettings]);
    const B7_handleInvestmentAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { AF_setInvestmentAmount(parseInt(e.target.value, 10) || 0); }, [AF_setInvestmentAmount]);
    const B8_handleRiskToleranceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { AH_setRiskTolerance(e.target.value); }, [AH_setRiskTolerance]);
    const B9_handleShowNotifications = useCallback(() => { AJ_setShowNotifications(!AI_showNotifications); }, [AI_showNotifications, AJ_setShowNotifications]);
    const BA_addDealFlow = useCallback((newDeal: any) => { AB_setDealFlowData([...AA_dealFlowData, { ...newDeal, id: String(Date.now()) }]); }, [AA_dealFlowData, AB_setDealFlowData]);
    const BB_updateDealFlowStatus = useCallback((id: string, status: string) => { AB_setDealFlowData(AA_dealFlowData.map(deal => deal.id === id ? { ...deal, status } : deal)); }, [AA_dealFlowData, AB_setDealFlowData]);
    const BC_removeDealFlow = useCallback((id: string) => { AB_setDealFlowData(AA_dealFlowData.filter(deal => deal.id !== id)); }, [AA_dealFlowData, AB_setDealFlowData]);
    const BD_addPortfolioCompany = useCallback((newCompany: any) => { AD_setPortfolioCompanies([...AC_portfolioCompanies, { ...newCompany, id: String(Date.now()) }]); }, [AC_portfolioCompanies, AD_setPortfolioCompanies]);
    const BE_updatePortfolioCompany = useCallback((id: string, updatedCompany: any) => { AD_setPortfolioCompanies(AC_portfolioCompanies.map(company => company.id === id ? { ...company, ...updatedCompany } : company)); }, [AC_portfolioCompanies, AD_setPortfolioCompanies]);
    const BF_removePortfolioCompany = useCallback((id: string) => { AD_setPortfolioCompanies(AC_portfolioCompanies.filter(company => company.id !== id)); }, [AC_portfolioCompanies, AD_setPortfolioCompanies]);
    const BG_createNotification = useCallback((message: string, type: string) => { AL_setNotifications([...AK_notifications, { id: String(Date.now()), message, type }]); }, [AK_notifications, AL_setNotifications]);
    const BH_removeNotification = useCallback((id: string) => { AL_setNotifications(AK_notifications.filter(notification => notification.id !== id)); }, [AK_notifications, AL_setNotifications]);

    // C. Memoized Values
    const C1_filteredDealFlow = useMemo(() => AA_dealFlowData.filter(deal => deal.companyName.toLowerCase().includes(A6_searchTerm.toLowerCase())), [AA_dealFlowData, A6_searchTerm]);
    const C2_totalInvestment = useMemo(() => AC_portfolioCompanies.reduce((acc, company) => acc + company.valuation, 0), [AC_portfolioCompanies]);
    const C3_riskAdjustedInvestment = useMemo(() => { return AG_riskTolerance === 'High' ? AE_investmentAmount * 1.5 : AG_riskTolerance === 'Low' ? AE_investmentAmount * 0.5 : AE_investmentAmount; }, [AE_investmentAmount, AG_riskTolerance]);

    // D. Component Rendering
    return (
        <Container fluid className="mt-3">
            <Navbar bg="light" expand="lg">
                <Navbar.Brand>The James Burvel O'Callaghan III Code - VC Desk</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav.Link onClick={() => A2_setActiveTab('D1_dealFlow')}>Deal Flow</Nav.Link>
                        <Nav.Link onClick={() => A2_setActiveTab('D2_investmentForm')}>New Investment</Nav.Link>
                        <Nav.Link onClick={() => A2_setActiveTab('D3_portfolioCompanies')}>Portfolio Companies</Nav.Link>
                        <NavDropdown title="More" id="basic-nav-dropdown">
                            <NavDropdown.Item onClick={B6_handleSettingsToggle}>Settings</NavDropdown.Item>
                            <NavDropdown.Item onClick={B9_handleShowNotifications}>Notifications ({AK_notifications.length})</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item>Help</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Form inline>
                        <InputGroup>
                            <FormControl type="text" placeholder="Search Companies" className="mr-sm-2" value={A6_searchTerm} onChange={B5_handleSearchChange} />
                            <InputGroup.Append>
                                <Button variant="outline-success">Search</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </Form>
                </Navbar.Collapse>
            </Navbar>

            {AI_showNotifications && (
                <ListGroup className="mt-3">
                    {AK_notifications.map(notification => (
                        <ListGroup.Item key={notification.id} variant={notification.type}>
                            {notification.message}
                            <Button variant="outline-danger" size="sm" className="float-right" onClick={() => BH_removeNotification(notification.id)}>
                                Dismiss
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            <Row>
                <Col>
                    <h1>Venture Capital Desk</h1>
                    <p>Manage investments, track deal flow, and oversee portfolio companies. User: {AM_userProfile.name} ({AM_userProfile.title})</p>
                    <Alert variant="info">Market Data: Dow {AP_marketData.dow}, Nasdaq {AP_marketData.nasdaq}, S&P 500 {AP_marketData.sp500}</Alert>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Tabs
                        activeKey={A1_activeTab}
                        onSelect={(tab) => A2_setActiveTab(tab || 'D4_dealFlow')}
                        id="vc-desk-tabs"
                        className="mb-3"
                    >
                        <Tab eventKey="D5_dealFlow" title="Deal Flow">
                            <DealFlowTable dealFlowData={C1_filteredDealFlow} updateDealFlowStatus={BB_updateDealFlowStatus} removeDealFlow={BC_removeDealFlow} />
                            <NewDealFlowForm addDealFlow={BA_addDealFlow} />
                        </Tab>
                        <Tab eventKey="D6_investmentForm" title="New Investment">
                            <InvestmentFormSection investmentAmount={AE_investmentAmount} riskTolerance={AG_riskTolerance} handleInvestmentAmountChange={B7_handleInvestmentAmountChange} handleRiskToleranceChange={B8_handleRiskToleranceChange} riskAdjustedInvestment={C3_riskAdjustedInvestment} />
                        </Tab>
                        {A4_selectedCompany ? (
                            <Tab eventKey="D7_portfolioCompaniesDetails" title="Portfolio Company Details">
                                <Button onClick={B3_handleBackToPortfolio} variant="link">Back to Portfolio</Button>
                                <PortfolioCompanyDetails companyId={A4_selectedCompany} />
                            </Tab>
                        ) : (
                            <Tab eventKey="D8_portfolioCompanies" title="Portfolio Companies">
                                <PortfolioCompanyList onSelectCompany={B1_handleSelectCompany} portfolioCompanies={AC_portfolioCompanies} />
                                <PortfolioSummary totalInvestment={C2_totalInvestment} />
                            </Tab>
                        )}

                    </Tabs>
                </Col>
            </Row>

            {A8_showSettings && (
                <SettingsPanel userProfile={AM_userProfile} setUserProfile={AN_setUserProfile} />
            )}

            <Footer />
        </Container>
    );
};

// E. Sub-Components

const DealFlowTable = ({ dealFlowData, updateDealFlowStatus, removeDealFlow }: { dealFlowData: any[], updateDealFlowStatus: (id: string, status: string) => void, removeDealFlow: (id: string) => void }) => {
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Stage</th>
                    <th>Industry</th>
                    <th>Location</th>
                    <th>Investment Needed</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {dealFlowData.map(deal => (
                    <tr key={deal.id}>
                        <td>{deal.companyName}</td>
                        <td>{deal.stage}</td>
                        <td>{deal.industry}</td>
                        <td>{deal.location}</td>
                        <td>{deal.investmentNeeded}</td>
                        <td>
                            <Form.Control as="select" value={deal.status} onChange={(e) => updateDealFlowStatus(deal.id, e.target.value)}>
                                <option>Active</option>
                                <option>Review</option>
                                <option>Approved</option>
                                <option>Rejected</option>
                            </Form.Control>
                        </td>
                        <td>
                            <Button variant="danger" size="sm" onClick={() => removeDealFlow(deal.id)}>Remove</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

const NewDealFlowForm = ({ addDealFlow }: { addDealFlow: (newDeal: any) => void }) => {
    const [E1_companyName, E2_setCompanyName] = useState('');
    const [E3_stage, E4_setStage] = useState('');
    const [E5_industry, E6_setIndustry] = useState('');
    const [E7_location, E8_setLocation] = useState('');
    const [E9_investmentNeeded, EA_setInvestmentNeeded] = useState(0);

    const EB_handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addDealFlow({ companyName: E1_companyName, stage: E3_stage, industry: E5_industry, location: E7_location, investmentNeeded: E9_investmentNeeded, status: 'Active' });
        E2_setCompanyName('');
        E4_setStage('');
        E6_setIndustry('');
        E8_setLocation('');
        EA_setInvestmentNeeded(0);
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Add New Deal Flow</Card.Title>
                <Form onSubmit={EB_handleSubmit}>
                    <Form.Group controlId="formCompanyName">
                        <Form.Label>Company Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter company name" value={E1_companyName} onChange={(e) => E2_setCompanyName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group controlId="formStage">
                        <Form.Label>Stage</Form.Label>
                        <Form.Control type="text" placeholder="Enter stage" value={E3_stage} onChange={(e) => E4_setStage(e.target.value)} required />
                    </Form.Group>
                    <Form.Group controlId="formIndustry">
                        <Form.Label>Industry</Form.Label>
                        <Form.Control type="text" placeholder="Enter industry" value={E5_industry} onChange={(e) => E6_setIndustry(e.target.value)} required />
                    </Form.Group>
                    <Form.Group controlId="formLocation">
                        <Form.Label>Location</Form.Label>
                        <Form.Control type="text" placeholder="Enter location" value={E7_location} onChange={(e) => E8_setLocation(e.target.value)} required />
                    </Form.Group>
                    <Form.Group controlId="formInvestmentNeeded">
                        <Form.Label>Investment Needed</Form.Label>
                        <Form.Control type="number" placeholder="Enter investment needed" value={E9_investmentNeeded} onChange={(e) => EA_setInvestmentNeeded(parseInt(e.target.value, 10) || 0)} required />
                    </Form.Group>
                    <Button variant="primary" type="submit">Add Deal</Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

const InvestmentFormSection = ({ investmentAmount, riskTolerance, handleInvestmentAmountChange, handleRiskToleranceChange, riskAdjustedInvestment }: { investmentAmount: number, riskTolerance: string, handleInvestmentAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void, handleRiskToleranceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, riskAdjustedInvestment: number }) => {
    return (
        <Card>
            <Card.Body>
                <Card.Title>Investment Parameters</Card.Title>
                <Form>
                    <Form.Group controlId="formInvestmentAmount">
                        <Form.Label>Investment Amount</Form.Label>
                        <Form.Control type="number" placeholder="Enter investment amount" value={investmentAmount} onChange={handleInvestmentAmountChange} />
                    </Form.Group>
                    <Form.Group controlId="formRiskTolerance">
                        <Form.Label>Risk Tolerance</Form.Label>
                        <Form.Control as="select" value={riskTolerance} onChange={handleRiskToleranceChange}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </Form.Control>
                    </Form.Group>
                    <Alert variant="success">Risk Adjusted Investment: ${riskAdjustedInvestment}</Alert>
                </Form>
            </Card.Body>
        </Card>
    );
};

const PortfolioSummary = ({ totalInvestment }: { totalInvestment: number }) => {
    return (
        <Card>
            <Card.Body>
                <Card.Title>Portfolio Summary</Card.Title>
                <Card.Text>Total Investment: ${totalInvestment}</Card.Text>
            </Card.Body>
        </Card>
    );
};

const SettingsPanel = ({ userProfile, setUserProfile }: { userProfile: any, setUserProfile: (profile: any) => void }) => {
    const [F1_name, F2_setName] = useState(userProfile.name);
    const [F3_title, F4_setTitle] = useState(userProfile.title);
    const [F5_email, F6_setEmail] = useState(userProfile.email);

    const F7_handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUserProfile({ name: F1_name, title: F3_title, email: F5_email });
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Settings</Card.Title>
                <Form onSubmit={F7_handleSubmit}>
                    <Form.Group controlId="formName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" value={F1_name} onChange={(e) => F2_setName(e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="formTitle">
                        <Form.Label>Title</Form.Label>
                        <Form.Control type="text" value={F3_title} onChange={(e) => F4_setTitle(e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="formEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" value={F5_email} onChange={(e) => F6_setEmail(e.target.value)} />
                    </Form.Group>
                    <Button variant="primary" type="submit">Update Profile</Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

const Footer = () => {
    return (
        <footer className="mt-5 text-center">
            <p>&copy; 2024 The James Burvel O'Callaghan III Code. All rights reserved.</p>
        </footer>
    );
};

export default VentureCapitalDeskView;

const aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa