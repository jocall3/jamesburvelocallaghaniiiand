/**
 * @file scripts/generate_spec.js
 * @description This script bundles a multi-file OpenAPI 3.1 specification into a single,
 *              distributable `openapi.json` file. It uses Redocly's OpenAPI CLI tool
 *              programmatically to resolve all `$ref` references across the source files
 *              and create a self-contained specification.
 *
 * @project This script is part of a larger project to automatically generate a massive,
 *          comprehensive OpenAPI specification. This is the final step in the build
 *          process, preparing the spec for distribution, code generation, and consumption
 *          by tools like Postman, Swagger UI, etc.
 *
 * @usage `node scripts/generate_spec.js`
 *
 * @pre-requisites
 * 1. Node.js installed.
 * 2. The `@redocly/openapi-cli` package must be installed in the project's devDependencies:
 *    `npm install @redocly/openapi-cli --save-dev` or `yarn add @redocly/openapi-cli --dev`
 * 3. The source OpenAPI files must exist, with a root entrypoint file, typically
 *    located at `src/index.json` or `src/openapi.yaml`.
 */

const fs = require('fs');
const path = require('path');
const { bundle } = require('@redocly/openapi-cli');

// --- Configuration ---

// Path to the root/entrypoint of the OpenAPI specification source.
// This file should contain the main info, servers, and references to other files.
const ROOT_SPEC_PATH = path.resolve(__dirname, '../src/index.json');

// The directory where the final bundled file will be saved.
const OUTPUT_DIR = path.resolve(__dirname, '../dist');

// The filename for the final bundled OpenAPI specification.
const OUTPUT_FILENAME = 'openapi.json';

// --- Main Bundling Logic ---

/**
 * Asynchronously bundles the multi-file OpenAPI specification into a single file.
 */
async function bundleSpecification() {
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILENAME);

  console.log('🚀 Starting OpenAPI specification bundling process...');
  console.log(`  > Source entrypoint: ${ROOT_SPEC_PATH}`);
  console.log(`  > Target output:     ${outputPath}`);

  try {
    // 1. Check if the source file exists before proceeding.
    if (!fs.existsSync(ROOT_SPEC_PATH)) {
      throw new Error(`Source specification file not found at: ${ROOT_SPEC_PATH}`);
    }

    // 2. Ensure the output directory exists. If not, create it recursively.
    if (!fs.existsSync(OUTPUT_DIR)) {
      console.log(`  > Creating output directory: ${OUTPUT_DIR}`);
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 3. Use Redocly's `bundle` function to resolve all references.
    // The `bundle` function is highly configurable. For this purpose, we are
    // simply resolving references (`ref`) without applying other rules.
    console.log('  > Bundling and resolving references...');
    const result = await bundle({
      ref: ROOT_SPEC_PATH,
      // Optional: Add a Redocly configuration object here if needed.
      // config: await loadConfig(),
    });

    // The bundled content is in `result.bundle.parsed`.
    const bundledSpecObject = result.bundle.parsed;

    // 4. Convert the final JavaScript object into a pretty-printed JSON string.
    // Using a 2-space indent is standard for readability.
    const finalSpecJson = JSON.stringify(bundledSpecObject, null, 2);

    // 5. Write the bundled JSON to the output file.
    console.log(`  > Writing bundled specification to file...`);
    fs.writeFileSync(outputPath, finalSpecJson, 'utf-8');

    // 6. Log success message with file size for context.
    const stats = fs.statSync(outputPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`\n✅ Success! OpenAPI specification bundled successfully.`);
    console.log(`   File saved to: ${outputPath} (${fileSizeInKB} KB)`);

  } catch (error) {
    console.error('\n❌ An error occurred during the bundling process:');
    // Redocly often provides detailed, structured errors.
    if (error.message) {
      console.error(`   Error Message: ${error.message}`);
    }
    if (error.stack) {
        console.error('   Stack Trace:');
        console.error(error.stack.split('\n').map(line => `   ${line}`).join('\n'));
    } else {
        console.error(error);
    }
    process.exit(1); // Exit with a non-zero code to indicate failure.
  }
}

// --- Script Execution ---

// Self-invoking async function to run the main logic.
(async () => {
  await bundleSpecification();
})();