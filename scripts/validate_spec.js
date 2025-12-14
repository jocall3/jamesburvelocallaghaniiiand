#!/usr/bin/env node

/**
 * @fileoverview Script to validate an OpenAPI 3.1 specification file.
 * @description This script uses @apidevtools/swagger-parser to validate a given
 * OpenAPI specification file against the OpenAPI 3.1 standard. It's designed
 * to be used in a CI/CD pipeline or as a local development tool to ensure
 * the generated specs are syntactically correct and fully compliant.
 *
 * This is a critical step in the project to "make as many files as possible"
 * by ensuring the massively generated OpenAPI specification is valid before
 * being used for code generation, documentation, or testing.
 *
 * Dependencies:
 *   - @apidevtools/swagger-parser: A robust parser and validator for OpenAPI specs.
 *
 * To install dependencies:
 *   npm install @apidevtools/swagger-parser
 *
 * Usage:
 *   node scripts/validate_spec.js <path_to_openapi_spec.json|yml>
 *
 * Example:
 *   node scripts/validate_spec.js openapi/generated_spec.json
 */

const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

/**
 * Main validation function that parses, resolves, and validates the spec.
 * @param {string} filePath - The absolute path to the OpenAPI specification file.
 */
async function validateSpec(filePath) {
  try {
    console.log(`🔍 Starting validation for: ${filePath}`);
    console.log('   This may take a moment for very large specifications...');

    // The `validate` method will parse, resolve all $refs (internal and external),
    // and validate the entire API definition against the OpenAPI 3.1 schema.
    // It automatically handles both JSON and YAML formats based on file content/extension.
    const api = await SwaggerParser.validate(filePath, {
      validate: {
        spec: true, // Enable OpenAPI spec validation (default is true)
      },
    });

    // The project goal is to generate a 3.1 spec, so we should explicitly check the version.
    const openapiVersion = api.openapi;
    if (!openapiVersion || !openapiVersion.startsWith('3.1.')) {
        console.warn(`\n⚠️  Warning: OpenAPI version is '${openapiVersion}'. This validator is intended for 3.1.x.`);
        console.warn(`   The spec is syntactically valid, but may not conform to all 3.1 features.`);
    }

    console.log('\n==================================================');
    console.log(`✅ SUCCESS: OpenAPI specification is valid!`);
    console.log('==================================================');
    console.log(`   - OpenAPI Version: ${api.openapi}`);
    console.log(`   - API Title: ${api.info.title}`);
    console.log(`   - API Version: ${api.info.version}`);
    console.log(`   - Found ${Object.keys(api.paths || {}).length} paths.`);
    
    if (api.components) {
        console.log(`   - Found ${Object.keys(api.components.schemas || {}).length} component schemas.`);
        console.log(`   - Found ${Object.keys(api.components.responses || {}).length} component responses.`);
        console.log(`   - Found ${Object.keys(api.components.parameters || {}).length} component parameters.`);
        console.log(`   - Found ${Object.keys(api.components.securitySchemes || {}).length} security schemes.`);
    }
    console.log('\nValidation complete. The specification is ready for code generation.');

    process.exit(0); // Exit with success code
  } catch (err) {
    console.error('\n==================================================');
    console.error(`❌ FAILURE: OpenAPI specification is invalid.`);
    console.error('==================================================');
    console.error(`File: "${filePath}"\n`);
    
    // @apidevtools/swagger-parser provides a detailed error object.
    // We print the message and details for easier debugging of the generated spec.
    if (err.message) {
        console.error('Error Details:\n');
        // The error message often contains a structured list of validation errors.
        // We'll print it directly as it's usually well-formatted.
        console.error(err.message);
    } else {
        // Fallback for unexpected error types
        console.error('An unexpected error occurred:');
        console.error(err);
    }
    
    console.error('\nValidation failed. Please fix the errors in the specification file before proceeding.');
    process.exit(1); // Exit with failure code
  }
}

/**
 * Script entry point. Handles command-line arguments and file checks.
 */
function main() {
  // Get the file path from the first command-line argument
  const specPathArg = process.argv[2];

  if (!specPathArg) {
    console.error('Error: Missing required argument.');
    console.error('Usage: node scripts/validate_spec.js <path_to_openapi_spec.json|yml>');
    process.exit(1);
  }

  // Resolve the path to an absolute path to avoid ambiguity
  const absoluteSpecPath = path.resolve(process.cwd(), specPathArg);

  // Check if the file exists before attempting to parse it
  if (!fs.existsSync(absoluteSpecPath)) {
    console.error(`Error: File not found at "${absoluteSpecPath}"`);
    process.exit(1);
  }

  // Check if the path points to a file, not a directory
  const stats = fs.statSync(absoluteSpecPath);
  if (stats.isDirectory()) {
    console.error(`Error: The provided path "${absoluteSpecPath}" is a directory, not a file.`);
    process.exit(1);
  }

  // Start the validation process
  validateSpec(absoluteSpecPath);
}

// Execute the main function
main();