
export interface Charge {
    id: string;
    amount: number;
    amount_refunded: number;
    currency: string;
    status: string;
    refunded: boolean;
    payment_intent: string;
    description?: string;
}
      