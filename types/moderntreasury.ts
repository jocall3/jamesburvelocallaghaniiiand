
export interface Counterparty { id: string; name: string; email: string; taxpayer_identifier: string; send_remittance_advice: boolean; live_mode: boolean; created_at: number; updated_at: number; discarded_at: number; metadata: any; }
export interface ExternalAccount { id: string; name: string; party_name: string; account_type: string; party_type: string; verification_status: string; account_details: any[]; routing_details: any[]; }
export interface Transaction { id: string; vendor_description: string; type: string; direction: string; amount: number; currency: string; }
export interface ErrorMessage { errors: { message: string; code: string } }
export interface AccountDetail { account_number_type: string; account_number_safe: string; }
      