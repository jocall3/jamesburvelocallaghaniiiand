import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  I2_API_ENDPOINT_11,
  I2_API_ENDPOINT_11_RESPONSE_SUCCESS,
  I2_API_ENDPOINT_11_RESPONSE_ERROR,
} from '@/lib/constants/apiEndpoints';
import {
  TokenizeAssetRequestSchema,
  TokenizeAssetResponseSchema,
} from '@/lib/schemas/api/protocol/assets/tokenize-asset';
import {
  AssetTokenizationService,
  TokenizationError,
} from '@/lib/services/assetTokenizationService';

// Mock implementation of the AssetTokenizationService
// In a real application, this would interact with a blockchain or tokenization platform.
const assetTokenizationService = new AssetTokenizationService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const endpoint = I2_API_ENDPOINT_11;
  const requestLogger = logger.child({ endpoint });

  requestLogger.info('Received request for tokenizing asset.');

  try {
    const requestBody = await request.json();

    // Validate the request body against the schema
    const validatedBody = TokenizeAssetRequestSchema.parse(requestBody);
    requestLogger.debug('Request body validated successfully.', {
      validatedBody,
    });

    // Call the service to tokenize the asset
    const tokenizationResult = await assetTokenizationService.tokenizeAsset(
      validatedBody.assetDetails,
      validatedBody.ownerDetails,
      validatedBody.tokenDetails
    );

    // Prepare the success response
    const successResponse = {
      status: 'success',
      message: 'Asset tokenized successfully.',
      data: {
        tokenId: tokenizationResult.tokenId,
        transactionHash: tokenizationResult.transactionHash,
        tokenUri: tokenizationResult.tokenUri,
      },
    };

    // Validate the success response against the schema
    const validatedSuccessResponse =
      TokenizeAssetResponseSchema.parse(successResponse);
    requestLogger.info('Asset tokenization successful.', {
      tokenId: validatedSuccessResponse.data.tokenId,
      transactionHash: validatedSuccessResponse.data.transactionHash,
    });

    return NextResponse.json(validatedSuccessResponse, {
      status: 201, // Created
    });
  } catch (error) {
    requestLogger.error('Error tokenizing asset.', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid request payload.',
          errors: error.errors,
        },
        { status: 400 } // Bad Request
      );
    }

    // Handle tokenization service errors
    if (error instanceof TokenizationError) {
      return NextResponse.json(
        {
          status: 'error',
          message: error.message,
          code: error.code,
        },
        { status: error.httpStatusCode || 500 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred during asset tokenization.',
      },
      { status: 500 } // Internal Server Error
    );
  }
}

// Placeholder for other HTTP methods if needed (e.g., GET, PUT, DELETE)
// export async function GET(request: NextRequest) { ... }
// export async function PUT(request: NextRequest) { ... }
// export async function DELETE(request: NextRequest) { ... }