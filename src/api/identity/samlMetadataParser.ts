import { parseStringPromise } from 'xml2js';

/**
 * Interface defining the structure of a Single Sign-On Service endpoint.
 */
export interface ISingleSignOnService {
    binding: string;
    location: string;
}

/**
 * Interface defining the structure of the parsed Identity Provider Metadata.
 */
export interface IIdpMetadata {
    entityId: string;
    signingCertificates: string[];
    singleSignOnServices: ISingleSignOnService[];
}

/**
 * Service responsible for parsing SAML Identity Provider (IDP) Metadata XML files.
 * Specifically designed to handle standard SAML 2.0 metadata structures like Google's IDP.
 */
export class SamlMetadataParser {

    /**
     * Parses the provided XML string content to extract relevant IDP configuration.
     * 
     * @param xmlContent - The raw string content of the GoogleIDPMetadata.xml file.
     * @returns A promise that resolves to the parsed IDP metadata object.
     * @throws Error if the XML is invalid or missing required descriptors.
     */
    public async parse(xmlContent: string): Promise<IIdpMetadata> {
        if (!xmlContent) {
            throw new Error('XML content is empty');
        }

        try {
            // Parse the XML string into a JavaScript object.
            // tagNameProcessors are used to strip namespaces (e.g., md:EntityDescriptor -> EntityDescriptor)
            // for easier property access.
            const parsedXml = await parseStringPromise(xmlContent, {
                tagNameProcessors: [this.stripNamespace],
                attrNameProcessors: [this.stripNamespace],
                explicitArray: true,
                mergeAttrs: true,
                normalizeTags: false,
                normalize: true
            });

            return this.extractMetadata(parsedXml);

        } catch (error: any) {
            throw new Error(`Failed to parse SAML Metadata: ${error.message}`);
        }
    }

    /**
     * Helper to strip namespaces from XML tags and attributes.
     */
    private stripNamespace(name: string): string {
        const split = name.split(':');
        return split.length > 1 ? split[1] : split[0];
    }

    /**
     * Extracts structured data from the parsed XML object.
     */
    private extractMetadata(parsedXml: any): IIdpMetadata {
        const entityDescriptor = parsedXml?.EntityDescriptor?.[0];

        if (!entityDescriptor) {
            throw new Error('Invalid Metadata: Missing EntityDescriptor');
        }

        const entityId = entityDescriptor.entityID?.[0];
        if (!entityId) {
            throw new Error('Invalid Metadata: Missing entityID in EntityDescriptor');
        }

        const idpDescriptor = entityDescriptor.IDPSSODescriptor?.[0];
        if (!idpDescriptor) {
            throw new Error('Invalid Metadata: Missing IDPSSODescriptor');
        }

        const signingCertificates = this.extractCertificates(idpDescriptor);
        const singleSignOnServices = this.extractSsoServices(idpDescriptor);

        return {
            entityId,
            signingCertificates,
            singleSignOnServices
        };
    }

    /**
     * Iterates through KeyDescriptors to find X.509 certificates used for signing.
     */
    private extractCertificates(idpDescriptor: any): string[] {
        const certificates: string[] = [];
        const keyDescriptors = idpDescriptor.KeyDescriptor || [];

        for (const descriptor of keyDescriptors) {
            // Filter for 'signing' use. If 'use' attribute is omitted, it applies to all.
            const use = descriptor.use?.[0];
            if (use && use !== 'signing') {
                continue;
            }

            const keyInfo = descriptor.KeyInfo?.[0];
            const x509Data = keyInfo?.X509Data?.[0];
            const rawCert = x509Data?.X509Certificate?.[0];

            if (rawCert) {
                // normalize the certificate string by removing whitespace/newlines
                certificates.push(rawCert.replace(/\s+/g, ''));
            }
        }

        return certificates;
    }

    /**
     * Iterates through SingleSignOnService elements to extract bindings and locations.
     */
    private extractSsoServices(idpDescriptor: any): ISingleSignOnService[] {
        const services: ISingleSignOnService[] = [];
        const ssoServices = idpDescriptor.SingleSignOnService || [];

        for (const sso of ssoServices) {
            const binding = sso.Binding?.[0];
            const location = sso.Location?.[0];

            if (binding && location) {
                services.push({
                    binding,
                    location
                });
            }
        }

        return services;
    }
}