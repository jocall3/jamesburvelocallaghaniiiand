import { NextResponse } from "next/server";
import { H3_API_ENDPOINT_3 } from "@/lib/constants";
import { z } from "zod";
import { createIdentity } from "@/lib/did/identity";
import { logger } from "@/lib/logger";

// Define the request body schema for identity registration
const RegisterIdentitySchema = z.object({
  did: z.string().min(1, "Decentralized Identifier (DID) is required."),
  publicKey: z.string().min(1, "Public key is required."),
  // Add other relevant fields for identity registration as needed
  // For example:
  // name: z.string().optional(),
  // metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * @swagger
 * /api/protocol/sovereignty/register-identity:
 *   post:
 *     summary: Register a self-sovereign identity (SSI).
 *     description: Allows a user to register their self-sovereign identity by providing their DID and public key.
 *     operationId: registerIdentity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               did:
 *                 type: string
 *                 description: The Decentralized Identifier (DID) of the identity.
 *               publicKey:
 *                 type: string
 *                 description: The public key associated with the DID.
 *     responses:
 *       200:
 *         description: Identity registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Identity registered successfully."
 *                 did:
 *                   type: string
 *                   example: "did:example:12345"
 *       400:
 *         description: Bad request. Invalid input provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid input: did is required."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to register identity."
 */
export async function POST(request: Request) {
  const endpoint = H3_API_ENDPOINT_3; // Corresponds to the file path

  try {
    const body = await request.json();

    // Validate the request body against the schema
    const validatedBody = RegisterIdentitySchema.parse(body);
    const { did, publicKey } = validatedBody;

    // Call the service function to create the identity
    // In a real-world scenario, this would involve interacting with a DID registry
    // or a decentralized ledger to anchor the DID and its associated keys.
    const identityCreated = await createIdentity(did, publicKey);

    if (!identityCreated) {
      logger.error(`[${endpoint}] Failed to create identity for DID: ${did}`);
      return NextResponse.json(
        { error: "Failed to register identity. Could not create identity record." },
        { status: 500 }
      );
    }

    logger.info(`[${endpoint}] Identity registered successfully for DID: ${did}`);
    return NextResponse.json(
      { message: "Identity registered successfully.", did: did },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      logger.warn(`[${endpoint}] Validation error: ${error.errors[0].message}`);
      return NextResponse.json({ error: `Invalid input: ${error.errors[0].message}` }, { status: 400 });
    }

    // Handle other potential errors during processing
    logger.error(`[${endpoint}] An unexpected error occurred:`, error);
    return NextResponse.json(
      { error: "An internal server error occurred while registering identity." },
      { status: 500 }
    );
  }
}