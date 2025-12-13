import { NextResponse } from 'next/server';
import { verifyBlock } from '@/lib/blockchain/genesis/blockVerification'; // Assuming this function exists and handles the core logic

// H2_API_ENDPOINT_2: API route for verifying a block within the Genesis chain.
export async function POST(request: Request) {
  try {
    const { blockData, previousBlockHash } = await request.json();

    if (!blockData || !previousBlockHash) {
      return NextResponse.json({ error: 'Missing blockData or previousBlockHash' }, { status: 400 });
    }

    // Assuming verifyBlock returns true if the block is valid, false otherwise.
    // It might also throw errors for specific validation failures.
    const isValid = await verifyBlock(blockData, previousBlockHash);

    if (isValid) {
      return NextResponse.json({ message: 'Block verified successfully', isValid: true }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Block verification failed', isValid: false }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error verifying block:', error);
    return NextResponse.json({ error: `Failed to verify block: ${error.message}` }, { status: 500 });
  }
}