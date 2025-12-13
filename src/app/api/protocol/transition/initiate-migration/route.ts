import { NextResponse } from 'next/server';
import { initiateLegacyMigration } from '@/lib/services/migrationService';
import { getSession } from '@/lib/auth';
import { ApiError } from '@/lib/utils/errors';

/**
 * @swagger
 * /api/protocol/transition/initiate-migration:
 *   post:
 *     tags:
 *       - Protocol Transition
 *     summary: Initiates the migration process from a legacy system.
 *     description: Requires administrative privileges. Triggers the backend service to start the data and configuration migration from the specified legacy source.
 *     operationId: initiateMigration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceSystemId:
 *                 type: string
 *                 description: Identifier for the legacy system to migrate from.
 *               migrationStrategy:
 *                 type: string
 *                 enum: [FULL_SYNC, DELTA_UPDATE, PHASED_ROLLOUT]
 *                 description: The chosen strategy for the migration.
 *             required:
 *               - sourceSystemId
 *               - migrationStrategy
 *     responses:
 *       202:
 *         description: Migration process initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Migration initiated"
 *                 migrationJobId:
 *                   type: string
 *                   example: "MIG-20240101-XYZ789"
 *       401:
 *         description: Unauthorized or Invalid session.
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin required).
 *       400:
 *         description: Bad Request - Invalid input parameters.
 *       500:
 *         description: Internal Server Error during migration initiation.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Access Denied: Administrator privileges required.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { sourceSystemId, migrationStrategy } = body;

    if (!sourceSystemId || !migrationStrategy) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: sourceSystemId and migrationStrategy.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Basic validation for strategy enum (assuming defined in service layer or constants)
    const validStrategies = ['FULL_SYNC', 'DELTA_UPDATE', 'PHASED_ROLLOUT'];
    if (!validStrategies.includes(migrationStrategy)) {
        return new NextResponse(
            JSON.stringify({ error: `Invalid migrationStrategy provided: ${migrationStrategy}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 1. Call the core service function to start the migration job
    const migrationJobId = await initiateLegacyMigration({
      sourceSystemId,
      strategy: migrationStrategy,
      initiatedBy: session.user.id,
    });

    // 2. Return a successful response indicating the job has started (202 Accepted)
    return NextResponse.json(
      {
        status: 'Migration initiated',
        migrationJobId: migrationJobId,
        message: `Migration from ${sourceSystemId} started successfully under job ID ${migrationJobId}.`,
      },
      { status: 202 }
    );

  } catch (error) {
    console.error('Error initiating migration:', error);

    if (error instanceof ApiError) {
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: 'Failed to initiate migration due to an internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
// Fallback for other methods
export async function GET() {
    return new NextResponse(null, { status: 405 });
}
export async function PUT() {
    return new NextResponse(null, { status: 405 });
}
export async function DELETE() {
    return new NextResponse(null, { status: 405 });
}
// Note: In a real application, '@/lib/services/migrationService' and '@/lib/auth' would need to be implemented.
// For this file generation, we assume their existence and correct signature.
// I4_API_ENDPOINT_13