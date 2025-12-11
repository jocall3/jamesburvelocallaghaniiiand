interface CorporateEntity {
  entityId: string;
  name: string;
  type: 'Parent' | 'Subsidiary' | 'Interco';
  status: 'Active' | 'Inactive';
  creationDate: string;
}

interface SubsidiaryInfo {
  subsidiaryId: string;
  parentEntityId: string;
  registrationNumber: string;
}

interface InterCompanyTransfer {
  transferId: string;
  originatingEntityId: string;
  receivingEntityId: string;
  amount: number;
  currency: string;
  transferDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  purpose: string;
}

interface CorporateProfile {
  entity: CorporateEntity;
  subsidiaryDetails?: SubsidiaryInfo;
}

interface FundTransferRequest {
  requestDetails: InterCompanyTransfer;
  sourceAccount: string;
  destinationAccount: string;
  approvalRequired: boolean;
}

interface CorporateServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

export type {
  CorporateEntity,
  SubsidiaryInfo,
  InterCompanyTransfer,
  CorporateProfile,
  FundTransferRequest,
  CorporateServiceResponse
};