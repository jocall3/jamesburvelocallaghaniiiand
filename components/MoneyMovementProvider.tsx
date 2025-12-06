
export * from './MoneyMovementContext';
export interface Payee { payeeId: string; payeeName: string; payeeNickname: string; paymentType: string; displayAccountNumber: string; }
export interface PayeeListResponse { payeeList: Payee[] }
export interface PayeeDetailsResponse { internalDomesticPayee?: any }
      