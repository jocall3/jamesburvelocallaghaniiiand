import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { DOMParser } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';

/**
 * Interface representing the authenticated user extracted from SAML.
 */
export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
    attributes: Record<string, string[]>;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    VIEWER = 'VIEWER'
}

/**
 * Service Provider implementation for handling SAML 2.0 authentication flow
 * with Google as the Identity Provider (IdP).
 */
export class SAMLServiceProvider {
    // Configuration derived from GoogleIDPMetadata.xml
    private readonly idpEntryPoint = 'https://accounts.google.com/o/saml2/idp?idpid=C01esbeng';
    private readonly idpIssuer = 'https://accounts.google.com/o/saml2?idpid=C01esbeng';
    
    // Certificate from metadata
    private readonly idpCert = `-----BEGIN CERTIFICATE-----
MIIDdDCCAlygAwIBAgIGAYsrub5TMA0GCSqGSIb3DQEBCwUAMHsxFDASBgNVBAoTC0dvb2dsZSBJ
bmMuMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MQ8wDQYDVQQDEwZHb29nbGUxGDAWBgNVBAsTD0dv
b2dsZSBGb3IgV29yazELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWEwHhcNMjMxMDE0
MDEwNzU0WhcNMjgxMDEyMDEwNzU0WjB7MRQwEgYDVQQKEwtHb29nbGUgSW5jLjEWMBQGA1UEBxMN
TW91bnRhaW4gVmlldzEPMA0GA1UEAxMGR29vZ2xlMRgwFgYDVQQLEw9Hb29nbGUgRm9yIFdvcmsx
CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAj8rGwJzIltPpk9OLYwTl8vx4c/i0mM/Oqn8cxcqxsOLZLjkVplZeGM6Hcs2pX18X
tBKJHlN8mlEJIwMdlU/qC12UWDAbddGfx7eAKY6w6J8rT93lHSYMdpXASQpyKqYWJUvNWqUZuMCB
rohI8eS4Qlr8djR2UH7yaIsiyshphwp5RjyKWfUwj9tHnVMN7G1OZyD8b/r979lrHgWCWqyKVImM
WGrxd7S2CPUueXspkGLJCGgRcpd+cVZzj6/qYJp8bIQetuZXictswtMQXEt5vRkeSc17RpzBSWbj
ogGkDFiXjB0i3NZCWG54P07+d65tZTTQKHBBXBGUmnRGeIW/VwIDAQABMA0GCSqGSIb3DQEBCwUA
A4IBAQB4GqLO7Qdbl0Rb2t3syxGQQpk2unF9eUI4CseN2V9dRD1rD0mxaKd01TVJeqfY8k8HZK6v
v06OyN++nWpfxJ0W64u2OwNrnHjMnP/JSBFGuWEQvq+zC97HHdmpbmu3IhzhrIoG18aEJm2OIeLw
1KyPvyjBqKo1rNZqRFPn297OuI9hUpHnXgJcq6Imn0sE61VQowq17LsAnOLsfyxVF1wbYbASLl5g
bNXOqXErqbYadpkk5ZCUaHjyLqHWyW3a5XAdSc+lbJaqdi/fFsXpbhf2scLhHQhax/EI6MXde8Pu
h8kUFhcdJpPujLPaO0s9+Xbgl2hxCO97XDn0l2UnF3pp
-----END CERTIFICATE-----`;

    private readonly spEntityId: string;
    private readonly callbackUrl: string;

    constructor(spEntityId: string, callbackUrl: string) {
        this.spEntityId = spEntityId;
        this.callbackUrl = callbackUrl;
    }

    /**
     * Generates a SAML AuthnRequest URL to redirect the user to Google.
     */
    public generateRedirectUrl(): string {
        const id = '_' + crypto.randomBytes(16).toString('hex');
        const instant = new Date().toISOString();

        const xmlRequest = `
            <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                                ID="${id}"
                                Version="2.0"
                                IssueInstant="${instant}"
                                ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                AssertionConsumerServiceURL="${this.callbackUrl}"
                                Destination="${this.idpEntryPoint}">
                <saml:Issuer>${this.spEntityId}</saml:Issuer>
                <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                                    AllowCreate="true"/>
            </samlp:AuthnRequest>
        `.trim();

        const deflated = zlib.deflateRawSync(Buffer.from(xmlRequest));
        const base64Request = deflated.toString('base64');
        
        return `${this.idpEntryPoint}?SAMLRequest=${encodeURIComponent(base64Request)}`;
    }

    /**
     * Validates a SAML Response from the IdP and maps it to an internal user.
     * @param rawBody The request body containing the SAMLResponse
     */
    public async processResponse(rawBody: { SAMLResponse: string }): Promise<AuthenticatedUser> {
        if (!rawBody || !rawBody.SAMLResponse) {
            throw new Error('Missing SAMLResponse in body');
        }

        const xmlBuffer = Buffer.from(rawBody.SAMLResponse, 'base64');
        const xmlString = xmlBuffer.toString('utf8');
        const doc = new DOMParser().parseFromString(xmlString);

        this.validateSignature(xmlString, doc);
        this.validateStatus(doc);
        this.validateAudience(doc);

        const attributes = this.extractAttributes(doc);
        const nameID = this.extractNameID(doc);

        return this.mapAttributesToUser(nameID, attributes);
    }

    /**
     * Validates the XML signature of the SAML Response using the IdP's certificate.
     */
    private validateSignature(xml: string, doc: Document): void {
        const signatureNode = this.findChilds(doc.documentElement, 'Signature')[0];
        
        if (!signatureNode) {
            throw new Error('SAML Response must contain a Signature');
        }

        const sig = new SignedXml();
        
        // Custom key provider using our hardcoded cert
        sig.keyInfoProvider = {
            getKeyInfo: () => `<X509Data><X509Certificate>${this.idpCert.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '')}</X509Certificate></X509Data>`,
            getKey: () => this.idpCert
        };

        sig.loadSignature(signatureNode.toString());
        
        const valid = sig.checkSignature(xml);
        if (!valid) {
            throw new Error('SAML Signature validation failed' + sig.validationErrors.join(', '));
        }
    }

    /**
     * Validates that the SAML Status Code is Success.
     */
    private validateStatus(doc: Document): void {
        const status = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusCode')[0];
        if (status) {
            const value = status.getAttribute('Value');
            if (value !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
                throw new Error(`Invalid SAML Status Code: ${value}`);
            }
        }
    }

    /**
     * Validates the AudienceRestriction matches our SP Entity ID.
     */
    private validateAudience(doc: Document): void {
        const audience = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Audience')[0];
        if (audience && audience.textContent !== this.spEntityId) {
            throw new Error(`Invalid Audience. Expected ${this.spEntityId}, got ${audience.textContent}`);
        }
    }

    /**
     * Extracts NameID (usually email) from the assertion.
     */
    private extractNameID(doc: Document): string {
        const nameIdNode = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'NameID')[0];
        if (!nameIdNode || !nameIdNode.textContent) {
            throw new Error('No NameID found in SAML Assertion');
        }
        return nameIdNode.textContent;
    }

    /**
     * Extracts attributes from the AttributeStatement.
     */
    private extractAttributes(doc: Document): Record<string, string[]> {
        const attributes: Record<string, string[]> = {};
        const attributeNodes = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Attribute');

        for (let i = 0; i < attributeNodes.length; i++) {
            const node = attributeNodes[i];
            const name = node.getAttribute('Name');
            if (name) {
                const values: string[] = [];
                const valueNodes = node.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeValue');
                for (let j = 0; j < valueNodes.length; j++) {
                    if (valueNodes[j].textContent) {
                        values.push(valueNodes[j].textContent!);
                    }
                }
                attributes[name] = values;
            }
        }
        return attributes;
    }

    /**
     * Maps extracted SAML attributes to the internal AuthenticatedUser model.
     * Determines roles based on attributes or email patterns.
     */
    private mapAttributesToUser(nameID: string, attributes: Record<string, string[]>): AuthenticatedUser {
        const firstName = attributes['firstName']?.[0] || attributes['givenName']?.[0] || '';
        const lastName = attributes['lastName']?.[0] || attributes['sn']?.[0] || '';
        
        const roles: UserRole[] = [UserRole.USER];

        // Logic to assign ADMIN role based on email domain or specific attribute
        // Example: Admins must be from the internal corporate domain
        if (nameID.endsWith('@google.com') || nameID.endsWith('@citi.com')) {
            roles.push(UserRole.ADMIN);
        }

        // Example: Check for specific group membership in attributes
        const groups = attributes['groups'] || [];
        if (groups.includes('saml-admins')) {
            if (!roles.includes(UserRole.ADMIN)) roles.push(UserRole.ADMIN);
        }

        return {
            id: nameID,
            email: nameID,
            firstName,
            lastName,
            roles,
            attributes
        };
    }

    /**
     * Helper to find direct children with specific tag name (ignoring namespace prefixes for simplicity in some lookups)
     */
    private findChilds(node: Node, localName: string): Node[] {
        const res: Node[] = [];
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                // Check if localName matches (handling namespaced tags like samlp:Response or ds:Signature)
                if (child.nodeName.endsWith(`:${localName}`) || child.nodeName === localName) {
                    res.push(child);
                }
            }
        }
        return res;
    }
}