```tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Table, Alert } from 'react-bootstrap';
import { getGoogleIDPMetadata, getActiveSessions, refreshGoogleIDPMetadata } from '../api/identityNexusApi'; // Assuming this API handles the calls
import { parseXML } from '../utils/xmlParser';

interface Session {
    sessionId: string;
    username: string;
    ipAddress: string;
    lastActivity: string; // Or Date, depending on your API
    status: string; // e.g., "Active", "Inactive"
}

interface MetadataStatus {
    validUntil?: string;
    entityId?: string;
    error?: string;
    certificateValid?: boolean;
    certificateExpiration?: string;
}

const IdentityNexusView: React.FC = () => {
    const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>({});
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingMetadata, setLoadingMetadata] = useState<boolean>(false);
    const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
    const [refreshingMetadata, setRefreshingMetadata] = useState<boolean>(false);
    const [showMetadataError, setShowMetadataError] = useState<boolean>(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoadingMetadata(true);
            try {
                const response = await getGoogleIDPMetadata();
                const metadata = await parseXML(response);
                if (metadata) {
                    const validUntil = metadata?.EntityDescriptor?.['@_validUntil'];
                    const entityId = metadata?.EntityDescriptor?.['@_entityID'];
                    const certificate = metadata?.EntityDescriptor?.IDPSSODescriptor?.KeyDescriptor?.KeyInfo?.X509Data?.X509Certificate?.['#text'];
                    let certificateValid = false;
                    let certificateExpiration = "Unknown";
                    if (certificate){
                        const cert = parseCertificate(certificate);
                        certificateValid = cert.isValid;
                        certificateExpiration = cert.expirationDate;

                    }


                    setMetadataStatus({ validUntil, entityId, certificateValid, certificateExpiration });
                    setShowMetadataError(false);
                }
                else {
                    setMetadataStatus({ error: "Failed to parse metadata" });
                    setShowMetadataError(true);
                }

            } catch (error: any) {
                console.error("Error fetching or parsing metadata:", error);
                setMetadataStatus({ error: error.message || "Failed to fetch metadata" });
                setShowMetadataError(true);

            } finally {
                setLoadingMetadata(false);
            }
        };

        const fetchSessions = async () => {
            setLoadingSessions(true);
            try {
                const sessionData = await getActiveSessions();
                setSessions(sessionData); // Assuming your API returns an array of sessions
            } catch (error: any) {
                console.error("Error fetching sessions:", error);
                // Optionally handle session fetch errors - display message, etc.
            } finally {
                setLoadingSessions(false);
            }
        };

        fetchMetadata();
        fetchSessions();
    }, []);

    const handleRefreshMetadata = async () => {
        setRefreshingMetadata(true);
        try {
            const response = await refreshGoogleIDPMetadata(); // Assuming you have an API call to refresh
            const metadata = await parseXML(response);

            if (metadata) {
                const validUntil = metadata?.EntityDescriptor?.['@_validUntil'];
                const entityId = metadata?.EntityDescriptor?.['@_entityID'];
                const certificate = metadata?.EntityDescriptor?.IDPSSODescriptor?.KeyDescriptor?.KeyInfo?.X509Data?.X509Certificate?.['#text'];
                let certificateValid = false;
                let certificateExpiration = "Unknown";
                if (certificate){
                    const cert = parseCertificate(certificate);
                    certificateValid = cert.isValid;
                    certificateExpiration = cert.expirationDate;

                }


                setMetadataStatus({ validUntil, entityId, certificateValid, certificateExpiration });
                setShowMetadataError(false);
            }
            else {
                setMetadataStatus({ error: "Failed to parse metadata" });
                setShowMetadataError(true);
            }


        } catch (error: any) {
            console.error("Error refreshing metadata:", error);
            setMetadataStatus({ error: error.message || "Failed to refresh metadata" });
            setShowMetadataError(true);

        } finally {
            setRefreshingMetadata(false);
        }
    };

    const parseCertificate = (certString:string) => {
        try {
            const pem = `-----BEGIN CERTIFICATE-----\n${certString}\n-----END CERTIFICATE-----`;
            const cert = window.forge.pki.certificateFromPem(pem);
            const now = new Date();
            const isValid = cert.validity.notAfter.getTime() > now.getTime();
            const expirationDate = cert.validity.notAfter.toLocaleString();
            return {
                isValid,
                expirationDate
            }


        } catch (error) {
            console.error("error parsing certificate", error);
            return {
                isValid: false,
                expirationDate: 'Invalid Certificate'
            }
        }
    }


    return (
        <Container fluid className="p-3">
            <h1>Identity Provider Management</h1>

            <Row className="mb-3">
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h2>Google IDP Metadata</h2>
                        </Card.Header>
                        <Card.Body>
                            {showMetadataError && <Alert variant="danger">{metadataStatus.error}</Alert>}
                            {loadingMetadata ? (
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                            ) : (
                                <>
                                    <p><b>Entity ID:</b> {metadataStatus.entityId || "Loading..."}</p>
                                    <p><b>Valid Until:</b> {metadataStatus.validUntil || "Loading..."}</p>
                                    <p><b>Certificate Status:</b> {metadataStatus.certificateValid ? "Valid" : "Invalid"}</p>
                                    <p><b>Certificate Expiration:</b> {metadataStatus.certificateExpiration || "Loading..."}</p>
                                    <Button variant="primary" onClick={handleRefreshMetadata} disabled={refreshingMetadata}>
                                        {refreshingMetadata ? (
                                            <>
                                                <Spinner animation="border" size="sm" role="status" className="me-1" />
                                                Refreshing...
                                            </>
                                        ) : (
                                            "Refresh Metadata"
                                        )}
                                    </Button>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h2>Active Sessions</h2>
                        </Card.Header>
                        <Card.Body>
                            {loadingSessions ? (
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                            ) : (
                                <Table striped bordered hover>
                                    <thead>
                                    <tr>
                                        <th>Session ID</th>
                                        <th>Username</th>
                                        <th>IP Address</th>
                                        <th>Last Activity</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sessions.map((session) => (
                                        <tr key={session.sessionId}>
                                            <td>{session.sessionId}</td>
                                            <td>{session.username}</td>
                                            <td>{session.ipAddress}</td>
                                            <td>{session.lastActivity}</td>
                                            <td>{session.status}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default IdentityNexusView;
```