import { NextRequest, NextResponse } from 'next/server';

// In a real application, this would be an interface reflecting your payment gateway's invoice object (e.g., Stripe Invoice)
interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number; // Amount in cents (e.g., 2999 for $29.99)
  currency: string; // e.g., 'usd'
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  periodStart: number; // Unix timestamp (seconds)
  periodEnd: number;   // Unix timestamp (seconds)
  dueDate?: number;    // Unix timestamp (seconds), optional
  pdfUrl?: string;     // URL to the invoice PDF, optional
  // Add other relevant fields as needed, e.g., customerId, description, lines items
}

// --- MOCK DATA & SERVICE LAYER (Replace with actual database/payment gateway integration) ---
// This mock simulates fetching data from a backend service or payment gateway like Stripe.
// In a production environment, this logic would be encapsulated in a dedicated service
// that interacts with your payment provider's SDK or API.
const mockInvoices: Invoice[] = [
  {
    id: 'inv_abc_001',
    subscriptionId: 'sub_abc_123',
    amount: 2999,
    currency: 'usd',
    status: 'paid',
    periodStart: new Date('2023-08-01T00:00:00Z').getTime() / 1000,
    periodEnd: new Date('2023-08-31T23:59:59Z').getTime() / 1000,
    dueDate: new Date('2023-09-01T00:00:00Z').getTime() / 1000,
    pdfUrl: 'https://example.com/invoices/inv_abc_001.pdf',
  },
  {
    id: 'inv_abc_002',
    subscriptionId: 'sub_abc_123',
    amount: 2999,
    currency: 'usd',
    status: 'paid',
    periodStart: new Date('2023-09-01T00:00:00Z').getTime() / 1000,
    periodEnd: new Date('2023-09-30T23:59:59Z').getTime() / 1000,
    dueDate: new Date('2023-10-01T00:00:00Z').getTime() / 1000,
    pdfUrl: 'https://example.com/invoices/inv_abc_002.pdf',
  },
  {
    id: 'inv_abc_003', // This is the latest for sub_abc_123
    subscriptionId: 'sub_abc_123',
    amount: 2999,
    currency: 'usd',
    status: 'open', // Could be 'open' or 'draft' if not yet paid
    periodStart: new Date('2023-10-01T00:00:00Z').getTime() / 1000,
    periodEnd: new Date('2023-10-31T23:59:59Z').getTime() / 1000,
    dueDate: new Date('2023-11-01T00:00:00Z').getTime() / 1000,
    pdfUrl: 'https://example.com/invoices/inv_abc_003.pdf', // Might not exist yet if draft/open
  },
  {
    id: 'inv_xyz_001',
    subscriptionId: 'sub_xyz_456',
    amount: 4999,
    currency: 'usd',
    status: 'paid',
    periodStart: new Date('2023-09-15T00:00:00Z').getTime() / 1000,
    periodEnd: new Date('2023-10-14T23:59:59Z').getTime() / 1000,
    dueDate: new Date('2023-10-15T00:00:00Z').getTime() / 1000,
    pdfUrl: 'https://example.com/invoices/inv_xyz_001.pdf',
  },
];

/**
 * Simulates fetching the latest invoice for a given subscription ID from a backend.
 *
 * In a production environment, this function would:
 * 1. Call your payment gateway's API (e.g., Stripe.invoices.list)
 *    - Filter by `subscription` ID.
 *    - Potentially filter by `status` (e.g., 'open', 'paid').
 *    - Use `limit: 1` and sort by `created` or `period_end` in descending order
 *      to efficiently retrieve the latest one.
 * 2. Handle API errors and network issues.
 *
 * @param subscriptionId The ID of the subscription to find the latest invoice for.
 * @returns A Promise that resolves to the latest Invoice object or null if none is found.
 */
async function getLatestInvoiceForSubscription(subscriptionId: string): Promise<Invoice | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const subscriptionInvoices = mockInvoices.filter(inv => inv.subscriptionId === subscriptionId);

  if (subscriptionInvoices.length === 0) {
    return null;
  }

  // Sort by periodEnd (descending) to ensure we get the most recent billing period's invoice.
  // If periodEnd is the same, fall back to dueDate or creation date.
  subscriptionInvoices.sort((a, b) => b.periodEnd - a.periodEnd);

  return subscriptionInvoices[0];
}
// --- END MOCK DATA & SERVICE LAYER ---

/**
 * API route handler for GET requests to retrieve the latest invoice for a specific subscription.
 *
 * This handler expects a subscription ID in the URL path (e.g., `/api/v1/subscriptions/sub_abc_123/latest_invoice`).
 * It fetches the latest invoice associated with that subscription and returns it as a JSON response.
 *
 * @param request The NextRequest object containing the incoming request details.
 * @param params An object containing dynamic route parameters, where `id` is the subscription ID.
 * @returns A NextResponse object with the latest invoice data (status 200) or an error message (status 400, 404, or 500).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // `id` corresponds to the `[id]` dynamic segment in the route path
) {
  try {
    const subscriptionId = params.id;

    // Although Next.js dynamic routes ensure `id` is present if the route matches,
    // an explicit check adds robustness.
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required in the URL path.' },
        { status: 400 }
      );
    }

    const latestInvoice = await getLatestInvoiceForSubscription(subscriptionId);

    if (!latestInvoice) {
      return NextResponse.json(
        { message: `No latest invoice found for subscription ID: ${subscriptionId}` },
        { status: 404 }
      );
    }

    // Successfully found and returned the latest invoice
    return NextResponse.json(latestInvoice, { status: 200 });
  } catch (error) {
    console.error(`Error fetching latest invoice for subscription ${params.id}:`, error);
    // In a production environment, avoid exposing raw error details to the client
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}