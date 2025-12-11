export interface X509Data {
  X509Certificate: string;
}

export interface KeyInfo {
  X509Data: X509Data;
}

export interface KeyDescriptor {
  use: string;
  KeyInfo: KeyInfo;
}

export interface SingleSignOnService {
  Binding: string;
  Location: string;
}

export interface IDPSSODescriptor {
  WantAuthnRequestsSigned: string | boolean;
  protocolSupportEnumeration: string;
  KeyDescriptor: KeyDescriptor[];
  NameIDFormat?: string | string[];
  SingleSignOnService: SingleSignOnService[];
}

export interface EntityDescriptor {
  entityID: string;
  validUntil?: string;
  IDPSSODescriptor: IDPSSODescriptor;
}

export interface SamlMetadata {
  EntityDescriptor: EntityDescriptor;
}