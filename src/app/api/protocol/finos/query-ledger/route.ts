import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LedgerService } from '@/lib/services/finos/ledgerService';

// --- Schema Definitions ---

/**
 * Defines the expected structure for the request body.
 * Assumes a simple query for a specific account and date range.
 */
const QueryLedgerSchema = z.object({
  accountId: z.string().uuid().describe('The unique identifier for the ledger account.'),
  startDate: z.string().datetime().describe('Start date for the transaction history query (ISO 8601).'),
  endDate: z.string().datetime().describe('End date for the transaction history query (ISO 8601).'),
  limit: z.number().int().min(1).max(1000).default(100).describe('Maximum number of transactions to return.'),
  cursor: z.string().optional().describe('Pagination cursor for subsequent requests.'),
});

// --- Handler ---

/**
 * H6_API_ENDPOINT_6: API route for querying the FinOS ledger for transaction history.
 * 
 * @param request The incoming Next.js Request object.
 * @returns A JSON response containing the transaction history or an error message.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = QueryLedgerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { accountId, startDate, endDate, limit, cursor } = validationResult.data;

    // 1. Initialize Ledger Service (assuming it handles external API calls/DB interaction)
    const ledgerService = new LedgerService();

    // 2. Fetch data from the FinOS Ledger system
    const transactionHistory = await ledgerService.queryTransactions({
      accountId,
      startDate,
      endDate,
      limit,
      cursor,
    });

    // 3. Return the successful response
    return NextResponse.json(transactionHistory, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/protocol/finos/query-ledger:', error);

    // Handle specific errors from the service layer if possible, otherwise return a generic 500
    if (error instanceof Error) {
        return NextResponse.json(
            {
                error: 'Failed to query FinOS ledger history',
                message: error.message,
            },
            { status: 500 }
        );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred during ledger query.',
      },
      { status: 500 }
    );
  }
}

// Optional: Define GET method if needed for simple health checks or documentation, 
// but POST is standard for complex queries involving a body.
export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        endpoint: 'FinOS Ledger Query API',
        method: 'POST required'
    }, { status: 200 });
}