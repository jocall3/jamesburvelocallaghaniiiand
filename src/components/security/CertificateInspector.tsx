import React, { useEffect, useState } from 'react';
import * as forge from 'node-forge';

interface CertificateData {
    id: number;
    serialNumber: string;
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    fingerprint: string;
    signatureAlgorithm: string;
    version: number;
    pem: string;
    publicKeyInfo: string;
}

interface CertificateInspectorProps {
    xmlContent: string;
}

const CertificateInspector: React.FC<CertificateInspectorProps> = ({ xmlContent }) => {
    const [certificates, setCertificates] = useState<CertificateData[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    useEffect(() => {
        if (!xmlContent) {
            setCertificates([]);
            return;
        }

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error(parserError.textContent || 'XML Parsing Error');
            }

            // Find all X509Certificate nodes regardless of namespace prefix
            const certNodes = xmlDoc.getElementsByTagNameNS('*', 'X509Certificate');
            const parsedCerts: CertificateData[] = [];

            for (let i = 0; i < certNodes.length; i++) {
                const node = certNodes[i];
                let base64 = node.textContent || '';
                // Sanitize: remove whitespace/newlines
                base64 = base64.replace(/\s+/g, '');
                
                if (!base64) continue;

                try {
                    // Reconstruct PEM format
                    const pem = `-----BEGIN CERTIFICATE-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
                    const cert = forge.pki.certificateFromPem(pem);

                    // Generate SHA-1 Fingerprint
                    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
                    const md = forge.md.sha1.create();
                    md.update(der);
                    const fingerprint = md.digest().toHex().match(/.{1,2}/g)?.join(':').toUpperCase();

                    // Format Subject/Issuer DN
                    const formatDN = (attrs: forge.pki.CertificateField[]) => 
                        attrs.map(attr => `${attr.shortName || attr.name}=${attr.value}`).join(', ');

                    // Public Key Info (Simplified)
                    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
                    const keyInfo = publicKey.n 
                        ? `RSA ${publicKey.n.bitLength()} bits` 
                        : 'Unknown Key Type';

                    parsedCerts.push({
                        id: i,
                        serialNumber: cert.serialNumber,
                        subject: formatDN(cert.subject.attributes),
                        issuer: formatDN(cert.issuer.attributes),
                        validFrom: cert.validity.notBefore.toLocaleString(),
                        validTo: cert.validity.notAfter.toLocaleString(),
                        fingerprint: fingerprint || 'N/A',
                        signatureAlgorithm: forge.pki.oids[cert.siginfo.algorithmOid] || cert.siginfo.algorithmOid,
                        version: cert.version,
                        pem: pem,
                        publicKeyInfo: keyInfo
                    });
                } catch (certErr) {
                    console.error('Failed to parse a certificate block', certErr);
                }
            }

            setCertificates(parsedCerts);
            setParseError(null);

        } catch (e: any) {
            console.error('Error parsing IDP Metadata', e);
            setParseError(e.message || 'Failed to parse XML content');
            setCertificates([]);
        }
    }, [xmlContent]);

    if (parseError) {
        return (
            <div style={{ color: '#d32f2f', padding: '16px', border: '1px solid #ef5350', borderRadius: '4px', backgroundColor: '#ffebee' }}>
                <strong>Error parsing metadata:</strong> {parseError}
            </div>
        );
    }

    if (!xmlContent) {
        return <div style={{ color: '#666', fontStyle: 'italic' }}>No metadata XML provided.</div>;
    }

    if (certificates.length === 0) {
        return <div style={{ padding: '16px' }}>No valid X.509 Certificates found in the provided metadata.</div>;
    }

    return (
        <div className="certificate-inspector-container">
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                Extracted X.509 Certificates ({certificates.length})
            </h3>
            {certificates.map((cert) => (
                <div key={cert.id} style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    marginBottom: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    backgroundColor: '#fff'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#1976d2' }}>Certificate #{cert.id + 1}</h4>
                        <span style={{ 
                            fontSize: '12px', 
                            backgroundColor: '#e3f2fd', 
                            color: '#0d47a1', 
                            padding: '4px 8px', 
                            borderRadius: '12px' 
                        }}>
                            {cert.publicKeyInfo}
                        </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', rowGap: '8px', fontSize: '14px' }}>
                        
                        <div style={{ fontWeight: 600, color: '#555' }}>Subject:</div>
                        <div style={{ wordBreak: 'break-word', color: '#333' }}>{cert.subject}</div>

                        <div style={{ fontWeight: 600, color: '#555' }}>Issuer:</div>
                        <div style={{ wordBreak: 'break-word', color: '#333' }}>{cert.issuer}</div>

                        <div style={{ fontWeight: 600, color: '#555' }}>Serial Number:</div>
                        <div style={{ fontFamily: 'monospace' }}>{cert.serialNumber}</div>

                        <div style={{ fontWeight: 600, color: '#555' }}>Valid From:</div>
                        <div>{cert.validFrom}</div>

                        <div style={{ fontWeight: 600, color: '#555' }}>Valid To:</div>
                        <div style={new Date(cert.validTo) < new Date() ? { color: 'red', fontWeight: 'bold' } : {}}>
                            {cert.validTo} {new Date(cert.validTo) < new Date() && '(Expired)'}
                        </div>

                        <div style={{ fontWeight: 600, color: '#555' }}>Fingerprint (SHA1):</div>
                        <div style={{ fontFamily: 'monospace', color: '#444' }}>{cert.fingerprint}</div>

                        <div style={{ fontWeight: 600, color: '#555' }}>Algorithm:</div>
                        <div>{cert.signatureAlgorithm}</div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <details>
                            <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, fontSize: '13px' }}>
                                View Raw PEM
                            </summary>
                            <pre style={{ 
                                backgroundColor: '#f5f5f5', 
                                padding: '15px', 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                overflowX: 'auto',
                                marginTop: '10px',
                                border: '1px solid #ddd'
                            }}>
                                {cert.pem}
                            </pre>
                        </details>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CertificateInspector;