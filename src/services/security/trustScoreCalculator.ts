```typescript
import { SAMLMetadataParser } from './samlMetadataParser';
import { GoogleIDPMetadata } from './googleIDPMetadata'; // Assuming you have this file
import { Metadata } from 'saml2-js'; // Or your chosen SAML library's Metadata type
import { IDPConfig } from '../../types'; // Assuming this exists for config


export class TrustScoreCalculator {

    private readonly idpConfig: IDPConfig;
    private readonly samlMetadataParser: SAMLMetadataParser;


    constructor(idpConfig: IDPConfig, samlMetadataParser: SAMLMetadataParser) {
        this.idpConfig = idpConfig;
        this.samlMetadataParser = samlMetadataParser;
    }


    async calculateTrustScore(idpMetadata: string, twoFactorEnabled: boolean, loginHistory: any[]): Promise<number> {
        let score = 0;

        // 1. IDP Metadata Strength
        const metadataStrength = await this.calculateMetadataStrength(idpMetadata);
        score += metadataStrength;


        // 2. 2FA Usage
        if (twoFactorEnabled) {
            score += this.idpConfig.twoFactorBonus;
        }

        // 3. Login History (example -  adjust logic as needed)
        const recentLogins = this.getRecentLogins(loginHistory, this.idpConfig.loginHistoryThresholdDays);

        if (recentLogins > 0) {
            score += Math.min(this.idpConfig.loginHistoryBonusPerLogin * recentLogins, this.idpConfig.maxLoginHistoryBonus);
        }

        return Math.max(0, Math.min(100, score)); // Ensure score is within 0-100
    }



    private async calculateMetadataStrength(idpMetadata: string): Promise<number> {
      try {
            const metadata = await this.samlMetadataParser.parseMetadata(idpMetadata);
            let score = 0;

            if (this.isCertificateStrong(metadata)) {
                score += this.idpConfig.certificateStrengthBonus;
            }

            if (this.isSingleSignOnSupported(metadata)) {
                score += this.idpConfig.ssoSupportBonus;
            }

          if (this.isWantAuthnRequestsSigned(metadata)) {
              score += this.idpConfig.authnRequestsSignedBonus;
          }



            return score;

        } catch (error) {
            console.error("Error parsing or analyzing metadata:", error);
            return 0; // Or a default value in case of error.  Handle the error gracefully.
        }
    }


    private isCertificateStrong(metadata: Metadata): boolean {

        if (!metadata || !metadata.idpSsoDescriptors || metadata.idpSsoDescriptors.length === 0) {
            return false;
        }


        for (const descriptor of metadata.idpSsoDescriptors) {
            if (descriptor && descriptor.keyDescriptors && descriptor.keyDescriptors.length > 0) {
                for (const keyDescriptor of descriptor.keyDescriptors) {
                  if (keyDescriptor.use === 'signing' && keyDescriptor.keyInfo && keyDescriptor.keyInfo.x509Data && keyDescriptor.keyInfo.x509Data.x509Certificates && keyDescriptor.keyInfo.x509Data.x509Certificates.length > 0) {
                        // More robust checks can be done here, e.g., check certificate validity period,
                        //  key size, and if it's a trusted CA.

                        const cert = keyDescriptor.keyInfo.x509Data.x509Certificates[0]; // Assuming one cert per descriptor.
                        if (cert && cert.length > 100) { // Simple heuristic: Long cert = better. Adjust the length as needed.
                            return true;
                        }

                    }
                }
            }
        }

        return false;
    }



    private isSingleSignOnSupported(metadata: Metadata): boolean {
        if (!metadata || !metadata.idpSsoDescriptors || metadata.idpSsoDescriptors.length === 0) {
            return false;
        }

        for (const descriptor of metadata.idpSsoDescriptors) {
            if (descriptor && descriptor.singleSignOnServices && descriptor.singleSignOnServices.length > 0) {
                return true; // Simple check, could be more robust.
            }
        }
        return false;
    }


    private isWantAuthnRequestsSigned(metadata: Metadata): boolean {
        if (!metadata || !metadata.idpSsoDescriptors || metadata.idpSsoDescriptors.length === 0) {
            return false;
        }

        for (const descriptor of metadata.idpSsoDescriptors) {
            if (descriptor && descriptor.wantAuthnRequestsSigned !== undefined) {
                return !descriptor.wantAuthnRequestsSigned; // Invert: We want false, as in Google's case
            }
        }
        return false;
    }


    private getRecentLogins(loginHistory: any[], thresholdDays: number): number {
        if (!loginHistory || loginHistory.length === 0) {
            return 0;
        }

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

        return loginHistory.filter(login => {
            const loginDate = new Date(login.timestamp); // Assuming a timestamp field
            return loginDate >= thresholdDate;
        }).length;
    }

}
```