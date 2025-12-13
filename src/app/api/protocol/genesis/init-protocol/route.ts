import { NextResponse } from 'next/server';
import { initializeGenesisProtocol } from '@/lib/protocol/genesis';
import { logger } from '@/lib/logger';

/**
 * API Route for initializing the Genesis protocol.
 * Corresponds to H1_API_ENDPOINT_1.
 *
 * POST /api/protocol/genesis/init-protocol
 */
export async function POST(request: Request) {
  logger.info('Received request to initialize Genesis protocol.');

  try {
    // In a real application, you might read configuration or payload from the request body
    // const body = await request.json();
    // const config = body.config;

    const result = await initializeGenesisProtocol();

    logger.info('Genesis protocol initialized successfully.', { result });

    return NextResponse.json(
      {
        success: true,
        message: 'Genesis protocol initialized successfully.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to initialize Genesis protocol.', { error });

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during initialization.';

    return NextResponse.json(
      {
        success: false,
        message: `Initialization failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

// Optional: Handle other methods if necessary, though initialization is typically POST
export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to initialize the Genesis protocol.' },
    { status: 405 }
  );
}