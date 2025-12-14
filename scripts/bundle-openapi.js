const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const CWD = process.cwd();
const ENTRY_FILE = path.resolve(CWD, 'openapi', 'index.yaml');
const OUTPUT_FILE = path.resolve(CWD, 'openapi-complete.json');

// Cache for already loaded and parsed file contents to avoid redundant I/O and parsing.
const fileCache = new Map();

/**
 * Deep clones a JSON-compatible object. This is crucial to prevent modifications
 * in one part of the spec from affecting another part that references the same file.
 * @param {any} obj The object to clone.
 * @returns {any} The cloned object.
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    // Using JSON.stringify/parse is a simple and effective way to deep clone
    // objects that are serializable to JSON, which is the case for OpenAPI specs.
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Resolves a JSON pointer within a given document.
 * See RFC 6901 for details on JSON Pointer syntax.
 * @param {object} doc The document to search within.
 * @param {string} pointer The JSON pointer string (e.g., '/components/schemas/User').
 * @returns {any} The resolved value.
 * @throws {Error} if the pointer cannot be resolved.
 */
function resolveJsonPointer(doc, pointer) {
    if (!pointer || pointer === '/') {
        return doc;
    }
    // Remove leading '#' if present, as it's not part of the pointer itself.
    if (pointer.startsWith('#')) {
        pointer = pointer.substring(1);
    }

    const tokens = pointer.split('/').slice(1);
    let current = doc;
    for (const token of tokens) {
        // Decode pointer tokens (~1 for / and ~0 for ~)
        const decodedToken = token.replace(/~1/g, '/').replace(/~0/g, '~');
        if (typeof current !== 'object' || current === null || !Object.prototype.hasOwnProperty.call(current, decodedToken)) {
            throw new Error(`JSON pointer "${pointer}" not found.`);
        }
        current = current[decodedToken];
    }
    return current;
}

/**
 * Recursively traverses a document object and resolves all external $refs.
 * Internal references (e.g., '#/components/schemas/User') are left untouched
 * as they are valid within the final bundled document.
 * @param {any} node The current node (object, array, primitive) being processed.
 * @param {string} basePath The directory path of the current file, used to resolve relative refs.
 * @param {Set<string>} visitedRefs A set to track the call stack of $ref resolutions to detect circular dependencies.
 * @returns {any} The node with all external $refs resolved and inlined.
 * @throws {Error} on circular dependencies or file resolution errors.
 */
function resolveRefs(node, basePath, visitedRefs) {
    if (node === null || typeof node !== 'object') {
        return node;
    }

    if (Array.isArray(node)) {
        return node.map(item => resolveRefs(item, basePath, visitedRefs));
    }

    // Check if the node is a $ref object.
    if (Object.prototype.hasOwnProperty.call(node, '$ref')) {
        const refValue = node['$ref'];

        // Ignore internal references; they are valid in the final bundled file.
        if (refValue.startsWith('#')) {
            return node;
        }

        // Check for circular dependencies.
        if (visitedRefs.has(refValue)) {
            throw new Error(`Circular dependency detected: ${[...visitedRefs, refValue].join(' -> ')}`);
        }

        const [filePath, jsonPointer] = refValue.split('#');
        const absolutePath = path.resolve(basePath, filePath);

        let referencedDoc;
        if (fileCache.has(absolutePath)) {
            referencedDoc = fileCache.get(absolutePath);
        } else {
            try {
                const fileContent = fs.readFileSync(absolutePath, 'utf8');
                referencedDoc = yaml.load(fileContent);
                fileCache.set(absolutePath, referencedDoc);
            } catch (e) {
                throw new Error(`Failed to read or parse file at ${absolutePath}: ${e.message}`);
            }
        }

        // The content from the other file might have its own relative refs.
        // We need to resolve them relative to *that* file's location.
        const referencedBasePath = path.dirname(absolutePath);
        
        // Add the current ref to the visited set for this specific resolution path.
        visitedRefs.add(refValue);

        // Get the specific part of the document if a JSON pointer is present.
        const targetNode = jsonPointer ? resolveJsonPointer(referencedDoc, `#${jsonPointer}`) : referencedDoc;

        // Deep clone the target node before processing its children.
        const clonedNode = deepClone(targetNode);

        // Recursively resolve refs within the newly inlined content.
        const resolvedContent = resolveRefs(clonedNode, referencedBasePath, visitedRefs);

        // Backtrack: remove the current ref from the visited set as we exit this resolution path.
        visitedRefs.delete(refValue);

        return resolvedContent;
    }

    // If not a $ref, recurse through the object's properties.
    const result = {};
    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            result[key] = resolveRefs(node[key], basePath, visitedRefs);
        }
    }
    return result;
}

/**
 * Main function to orchestrate the bundling of the OpenAPI specification.
 */
function bundleOpenApiSpec() {
    console.log('Bundling OpenAPI spec...');
    console.log(`Entry file: ${ENTRY_FILE}`);

    try {
        if (!fs.existsSync(ENTRY_FILE)) {
            throw new Error(`Entry file not found. Please ensure 'openapi/index.yaml' exists in your project root.`);
        }

        const entryContent = fs.readFileSync(ENTRY_FILE, 'utf8');
        const rootDoc = yaml.load(entryContent);
        const entryDir = path.dirname(ENTRY_FILE);

        // Start the resolution process from the root document.
        const bundledSpec = resolveRefs(rootDoc, entryDir, new Set());

        // Ensure the output directory exists.
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write the bundled spec to a single, complete JSON file.
        // Using a 2-space indent for readability.
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundledSpec, null, 2), 'utf8');

        console.log(`✅ OpenAPI spec successfully bundled to: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ An error occurred during bundling:');
        console.error(error.message);
        process.exit(1);
    }
}

// Execute the script.
bundleOpenApiSpec();