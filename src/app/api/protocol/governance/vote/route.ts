import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GovernanceService } from '@/lib/services/governanceService';
import { getSession } from '@/lib/auth';

// --- Schemas ---

const VoteSchema = z.object({
  proposalId: z.string().uuid(),
  voteChoice: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
});

// --- Dependencies ---

// Assume GovernanceService handles all blockchain/smart contract interactions
const governanceService = new GovernanceService();

/**
 * @swagger
 * /api/protocol/governance/vote:
 *   post:
 *     tags:
 *       - Governance
 *     summary: Cast a vote on a specific governance proposal
 *     description: Authenticated users can cast their vote (FOR, AGAINST, or ABSTAIN) for an active proposal.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteInput'
 *     responses:
 *       200:
 *         description: Vote successfully cast.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionHash:
 *                   type: string
 *                   description: The hash of the transaction confirming the vote.
 *       400:
 *         description: Invalid input data.
 *       401:
 *         description: Unauthorized access.
 *       403:
 *         description: Proposal is not active or user is ineligible to vote.
 *       500:
 *         description: Internal server error during voting process.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user?.address) {
      return NextResponse.json({ error: 'Unauthorized: User session not found or missing wallet address.' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = VoteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request payload.', details: validationResult.error.errors }, { status: 400 });
    }

    const { proposalId, voteChoice } = validationResult.data;
    const voterAddress = session.user.address;

    // 1. Pre-check: Ensure the proposal is open and the user is eligible (handled internally by the service)
    // This step might involve checking proposal state on-chain or via cached data.
    const proposalStatus = await governanceService.getProposalStatus(proposalId);

    if (proposalStatus !== 'ACTIVE') {
      return NextResponse.json({ error: `Proposal ${proposalId} is not currently active. Status: ${proposalStatus}` }, { status: 403 });
    }

    // 2. Cast the vote
    console.log(`Casting vote for proposal ${proposalId}: ${voteChoice} by ${voterAddress}`);

    const transactionHash = await governanceService.castVote(
      proposalId,
      voterAddress,
      voteChoice
    );

    return NextResponse.json({
      success: true,
      message: 'Vote successfully cast.',
      transactionHash,
    }, { status: 200 });

  } catch (error) {
    console.error('Error casting governance vote:', error);

    let errorMessage = 'Failed to cast vote due to an internal error.';
    let statusCode = 500;

    if (error instanceof Error) {
      // Specific error handling based on GovernanceService implementation might go here
      if (error.message.includes('Voter not eligible')) {
        statusCode = 403;
        errorMessage = 'You are not eligible to vote on this proposal (e.g., insufficient tokens or already voted).';
      } else if (error.message.includes('Proposal not found')) {
        statusCode = 404;
        errorMessage = 'The specified proposal ID does not exist.';
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// Optional: Implement GET to check if a user has already voted on a proposal
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
        return NextResponse.json({ error: 'Missing required query parameter: proposalId' }, { status: 400 });
    }

    const session = await getSession();
    if (!session || !session.user?.address) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const hasVoted = await governanceService.hasVoted(proposalId, session.user.address);
        return NextResponse.json({ proposalId, address: session.user.address, hasVoted }, { status: 200 });
    } catch (error) {
        console.error(`Error checking vote status for ${proposalId}:`, error);
        return NextResponse.json({ error: 'Could not verify voting status.' }, { status: 500 });
    }
}
// Placeholder for necessary imports/definitions if this were a full Next.js project structure
// In a real project, GovernanceService and getSession would be fully implemented elsewhere.
// For this file generation, we assume their existence.
// Mock definitions for completeness if running standalone:
/*
class GovernanceService {
    async getProposalStatus(id: string): Promise<'ACTIVE' | 'QUEUED' | 'SUCCEEDED' | 'FAILED'> { return 'ACTIVE'; }
    async castVote(proposalId: string, address: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN'): Promise<string> { return '0xabc123...'; }
    async hasVoted(proposalId: string, address: string): Promise<boolean> { return false; }
}
async function getSession() {
    return { user: { address: '0xVoterAddress' } };
}
*/