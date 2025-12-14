#!/usr/bin/env node

/**
 * @file This script bundles a multi-file OpenAPI 3.1 definition into a single,
 * self-contained JSON file. It resolves all `$ref` pointers, making the output
 * suitable for distribution, code generation, or use with tools like Postman
* and Swagger UI.
 *
 * @author AI Programmer
 * @version 1.0.0
 *
 * @requires @redocly/openapi-core - For parsing and bundling OpenAPI definitions.
 * @requires path - Node.js core module for handling file paths.
 * @requires fs/promises - Node.js core module for asynchronous file system operations.
 *
 * @example
 * // To run this script from the project root:
 * node scripts/bundle.js
 *
 * @description
 * The script performs the following steps:
 * 1. Defines the input (root OpenAPI file) and output (bundled JSON file) paths.
 * 2. Ensures the output directory exists.
 * 3. Uses Redocly's `bundle` function to process the root OpenAPI file.
 * 4. The `bundle` function recursively follows and resolves all local and remote `$ref`s.
 * 5. It reports any issues (warnings or errors) encountered during the bundling process.
 * 6. The resulting bundled OpenAPI object is stringified into a formatted JSON.
 * 7. The JSON string is written to the specified output file.
 * 8. The script logs its progress and exits with a non-zero code on failure.
 */

const { bundle } = require('@redocly/openapi-core');
const { loadConfig } = require('@redocly/openapi-core');
const path = require('path');
const fs = require('fs/promises');

// --- Configuration ---

/**
 * The path to the root OpenAPI definition file.
 * This file is the entry point for the bundling process.
 * It's resolved relative to the project root directory.
 * @type {string}
 */
const ROOT_API_FILE = path.resolve(__dirname, '..', 'openapi', 'index.yaml');

/**
 * The directory where the bundled output file will be saved.
 * It's resolved relative to the project root directory.
 * @type {string}
 */
const OUTPUT_DIR = path.resolve(__dirname, '..', 'dist');

/**
 * The name of the final bundled OpenAPI JSON file.
 * @type {string}
 */
const OUTPUT_FILENAME = 'openapi.json';

/**
 * The full path for the output file.
 * @type {string}
 */
const OUTPUT_FILE_PATH = path.join(OUTPUT_DIR, OUTPUT_FILENAME);


/**
 * The main asynchronous function that orchestrates the bundling process.
 */
async function main() {
  console.log('🚀 Starting OpenAPI bundling process...');
  console.log(`▶️  Input file: ${path.relative(process.cwd(), ROOT_API_FILE)}`);

  try {
    // 1. Ensure the output directory exists.
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Output directory ensured: ${path.relative(process.cwd(), OUTPUT_DIR)}`);

    // 2. Load Redocly configuration. This is optional but recommended as it
    // allows for custom rules, plugins, and other advanced configurations.
    // It will automatically find a `.redocly.yaml` or similar config file.
    const config = await loadConfig();
    console.log('ℹ️  Redocly configuration loaded.');

    // 3. Bundle the OpenAPI definition.
    // The `bundle` function resolves all references and creates a single document.
    const { bundle: bundledSpec, problems } = await bundle({
      ref: ROOT_API_FILE,
      config,
    });

    // 4. Report any problems found during bundling.
    // Problems can be errors or warnings, e.g., unresolved references.
    if (problems.length > 0) {
      console.warn('\n⚠️  Bundling completed with the following issues:');
      problems.forEach(p => {
        const location = p.location?.pointer || 'unknown location';
        const severity = p.severity.toUpperCase();
        console.warn(`  - [${severity}] ${p.message} (at ${location})`);
      });
    } else {
      console.log('✅ Bundling process completed with no issues.');
    }

    // 5. Convert the bundled specification object to a formatted JSON string.
    // Using a 2-space indent for readability.
    const jsonOutput = JSON.stringify(bundledSpec.root, null, 2);
    console.log('ℹ️  Bundled specification converted to JSON format.');

    // 6. Write the final JSON to the output file.
    await fs.writeFile(OUTPUT_FILE_PATH, jsonOutput, 'utf-8');
    console.log(`\n🎉 Successfully bundled OpenAPI spec!`);
    console.log(`✅ Output file created at: ${path.relative(process.cwd(), OUTPUT_FILE_PATH)}`);

  } catch (error) {
    console.error('\n❌ An unexpected error occurred during the bundling process:');
    console.error(error.stack || error.message);
    process.exit(1); // Exit with a non-zero status code to indicate failure
  }
}

// Execute the main function.
main();