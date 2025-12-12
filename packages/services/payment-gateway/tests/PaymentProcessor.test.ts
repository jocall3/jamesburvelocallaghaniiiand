import { PaymentProcessor } from '../src/PaymentProcessor';
import { PaymentProvider } from '../src/PaymentProvider';
import { PaymentIntent } from '../src/PaymentIntent';

// Mock PaymentProvider implementation for testing
class MockPaymentProvider implements PaymentProvider {
    async createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent> {
        return {
            id: 'mock_payment_intent_id',
            amount: amount,
            currency: currency,
            status: 'requires_payment_method',
            clientSecret: 'mock_client_secret',
        };
    }

    async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        if (paymentIntentId === 'mock_payment_intent_id') {
            return {
                id: paymentIntentId,
                amount: 100,
                currency: 'USD',
                status: 'succeeded',
                clientSecret: 'mock_client_secret',
            };
        } else {
            throw new Error('Payment intent not found');
        }
    }

    async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        if (paymentIntentId === 'mock_payment_intent_id') {
            return {
                id: paymentIntentId,
                amount: 100,
                currency: 'USD',
                status: 'canceled',
                clientSecret: 'mock_client_secret',
            };
        } else {
            throw new Error('Payment intent not found');
        }
    }

    async refundPayment(paymentIntentId: string, amount: number): Promise<PaymentIntent> {
        if (paymentIntentId === 'mock_payment_intent_id') {
            return {
                id: paymentIntentId,
                amount: amount,
                currency: 'USD',
                status: 'refunded',
                clientSecret: 'mock_client_secret',
            };
        } else {
            throw new Error('Payment intent not found');
        }
    }
}

describe('PaymentProcessor', () => {
    let paymentProcessor: PaymentProcessor;
    let mockPaymentProvider: MockPaymentProvider;

    beforeEach(() => {
        mockPaymentProvider = new MockPaymentProvider();
        paymentProcessor = new PaymentProcessor(mockPaymentProvider);
    });

    it('should create a payment intent', async () => {
        const amount = 100;
        const currency = 'USD';
        const paymentIntent = await paymentProcessor.createPaymentIntent(amount, currency);

        expect(paymentIntent).toEqual({
            id: 'mock_payment_intent_id',
            amount: amount,
            currency: currency,
            status: 'requires_payment_method',
            clientSecret: 'mock_client_secret',
        });
    });

    it('should confirm a payment intent', async () => {
        const paymentIntentId = 'mock_payment_intent_id';
        const paymentIntent = await paymentProcessor.confirmPaymentIntent(paymentIntentId);

        expect(paymentIntent).toEqual({
            id: paymentIntentId,
            amount: 100,
            currency: 'USD',
            status: 'succeeded',
            clientSecret: 'mock_client_secret',
        });
    });

    it('should throw an error if confirming a non-existent payment intent', async () => {
        const paymentIntentId = 'non_existent_id';

        await expect(paymentProcessor.confirmPaymentIntent(paymentIntentId)).rejects.toThrow('Payment intent not found');
    });

    it('should cancel a payment intent', async () => {
        const paymentIntentId = 'mock_payment_intent_id';
        const paymentIntent = await paymentProcessor.cancelPaymentIntent(paymentIntentId);

        expect(paymentIntent).toEqual({
            id: paymentIntentId,
            amount: 100,
            currency: 'USD',
            status: 'canceled',
            clientSecret: 'mock_client_secret',
        });
    });

    it('should throw an error if cancelling a non-existent payment intent', async () => {
        const paymentIntentId = 'non_existent_id';

        await expect(paymentProcessor.cancelPaymentIntent(paymentIntentId)).rejects.toThrow('Payment intent not found');
    });

    it('should refund a payment', async () => {
        const paymentIntentId = 'mock_payment_intent_id';
        const amount = 50;
        const paymentIntent = await paymentProcessor.refundPayment(paymentIntentId, amount);

        expect(paymentIntent).toEqual({
            id: paymentIntentId,
            amount: amount,
            currency: 'USD',
            status: 'refunded',
            clientSecret: 'mock_client_secret',
        });
    });

    it('should throw an error if refunding a non-existent payment intent', async () => {
        const paymentIntentId = 'non_existent_id';
        const amount = 50;

        await expect(paymentProcessor.refundPayment(paymentIntentId, amount)).rejects.toThrow('Payment intent not found');
    });
});