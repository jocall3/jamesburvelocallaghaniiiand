import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentMethod } from '@/types/PaymentMethod';
import { getPaymentMethodById, updatePaymentMethod, deletePaymentMethod } from '@/lib/paymentMethods';

// Mock database (replace with actual database interaction)
let paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'credit_card', card_number: '************1234', expiry_date: '12/24', cvv: '123', user_id: 'user1' },
    { id: '2', type: 'paypal', email: 'test@example.com', user_id: 'user1' },
];

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Payment method ID is required.' });
    }

    try {
        switch (req.method) {
            case 'GET': // AE50
                const paymentMethod = await getPaymentMethodById(id);
                if (!paymentMethod) {
                    return res.status(404).json({ error: 'Payment method not found.' });
                }
                return res.status(200).json(paymentMethod);

            case 'PUT': // AE52
                const updatedPaymentMethodData = req.body;
                try {
                    const updatedPaymentMethod = await updatePaymentMethod(id, updatedPaymentMethodData);
                    if (!updatedPaymentMethod) {
                        return res.status(404).json({ error: 'Payment method not found.' });
                    }
                    return res.status(200).json(updatedPaymentMethod);
                } catch (updateError: any) {
                    console.error("Error updating payment method:", updateError);
                    return res.status(500).json({ error: 'Failed to update payment method.', details: updateError.message });
                }

            case 'DELETE': // AE53
                try {
                    const deleted = await deletePaymentMethod(id);
                    if (!deleted) {
                        return res.status(404).json({ error: 'Payment method not found.' });
                    }
                    return res.status(204).end(); // No content on successful deletion
                } catch (deleteError: any) {
                    console.error("Error deleting payment method:", deleteError);
                    return res.status(500).json({ error: 'Failed to delete payment method.', details: deleteError.message });
                }

            default:
                res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error("API Error:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}