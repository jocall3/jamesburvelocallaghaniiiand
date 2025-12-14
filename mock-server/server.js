const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml'); // For potentially loading YAML spec
const { match } = require('path-to-regexp'); // For matching paths with parameters

const app = express();
const PORT = process.env.PORT || 3000;
// Assuming the generated OpenAPI spec will be in the 'dist' directory
const OPENAPI_SPEC_PATH = path.join(__dirname, '../dist/openapi.json');

let openApiSpec = null;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to load OpenAPI spec from file
const loadOpenApiSpec = () => {
    try {
        const specContent = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
        // Try parsing as JSON first, then YAML
        try {
            openApiSpec = JSON.parse(specContent);
            console.log('OpenAPI spec loaded successfully (JSON).');
        } catch (jsonError) {
            try {
                openApiSpec = yaml.load(specContent);
                console.log('OpenAPI spec loaded successfully (YAML).');
            } catch (yamlError) {
                console.error('Failed to parse OpenAPI spec as JSON or YAML:', yamlError.message);
                openApiSpec = null;
            }
        }
    } catch (err) {
        console.error(`Error loading OpenAPI spec from ${OPENAPI_SPEC_PATH}:`, err.message);
        openApiSpec = null;
    }
};

// Load spec on server start
loadOpenApiSpec();

// Watch for changes in the OpenAPI spec file (useful for development)
fs.watchFile(OPENAPI_SPEC_PATH, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        console.log('OpenAPI spec file changed. Reloading...');
        loadOpenApiSpec();
    }
});

// Serve the OpenAPI spec file directly
app.get('/openapi.json', (req, res) => {
    if (openApiSpec) {
        res.json(openApiSpec);
    } else {
        res.status(500).json({ error: 'OpenAPI spec not loaded or found.' });
    }
});

// Helper function to recursively generate a mock response based on a schema
// This is a basic generator. For more advanced mocking, consider a library like json-schema-faker.
const generateMockResponse = (schema) => {
    if (!schema) {
        return null;
    }

    // Prioritize example if available at the schema level
    if (schema.example !== undefined) {
        return schema.example;
    }

    // Handle allOf, anyOf, oneOf (simple approach: merge allOf, pick first for anyOf/oneOf)
    if (schema.allOf && schema.allOf.length > 0) {
        return Object.assign({}, ...schema.allOf.map(generateMockResponse));
    }
    if (schema.oneOf && schema.oneOf.length > 0) {
        return generateMockResponse(schema.oneOf[0]); // Pick the first one
    }
    if (schema.anyOf && schema.anyOf.length > 0) {
        return generateMockResponse(schema.anyOf[0]); // Pick the first one
    }

    switch (schema.type) {
        case 'object':
            const obj = {};
            if (schema.properties) {
                for (const key in schema.properties) {
                    obj[key] = generateMockResponse(schema.properties[key]);
                }
            }
            return obj;
        case 'array':
            if (schema.items) {
                // If examples are provided for items, use them
                if (schema.items.examples && schema.items.examples.length > 0) {
                    return schema.items.examples;
                }
                // If a single example is provided for items
                if (schema.items.example !== undefined) {
                    return [schema.items.example];
                }
                // Otherwise, generate one item
                return [generateMockResponse(schema.items)];
            }
            return [];
        case 'string':
            if (schema.enum && schema.enum.length > 0) {
                return schema.enum[0]; // Pick first enum value
            }
            if (schema.format === 'date') return '2023-10-27';
            if (schema.format === 'date-time') return '2023-10-27T10:00:00Z';
            if (schema.format === 'uuid') return 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
            if (schema.format === 'email') return 'test@example.com';
            if (schema.format === 'uri') return 'https://example.com/resource/123';
            return schema.example !== undefined ? schema.example : 'string_value';
        case 'number':
        case 'integer':
            return schema.example !== undefined ? schema.example : 123;
        case 'boolean':
            return schema.example !== undefined ? schema.example : true;
        case 'null':
            return null;
        default:
            return schema.example !== undefined ? schema.example : null;
    }
};

// Generic mock response handler for all other routes
app.all('*', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({ error: 'OpenAPI spec not loaded. Cannot provide mock responses.' });
    }

    const reqPath = req.path;
    const reqMethod = req.method.toLowerCase();

    console.log(`Received ${reqMethod.toUpperCase()} request for: ${reqPath}`);

    let matchedPath = null;
    let pathItem = null;
    // let pathParams = {}; // Not used in this basic mock, but useful for more advanced logic

    // Iterate through OpenAPI paths to find a match, handling path parameters
    for (const specPath in openApiSpec.paths) {
        // Convert OpenAPI path to a regex-compatible path for `path-to-regexp`
        // e.g., /users/{userId} -> /users/:userId
        const expressPath = specPath.replace(/{(\w+)}/g, ':$1');
        const matcher = match(expressPath, { decode: decodeURIComponent });

        const matchResult = matcher(reqPath);
        if (matchResult) {
            matchedPath = specPath;
            pathItem = openApiSpec.paths[specPath];
            // pathParams = matchResult.params; // Store path parameters if needed
            break;
        }
    }

    if (matchedPath && pathItem && pathItem[reqMethod]) {
        const operation = pathItem[reqMethod];
        console.log(`Matched OpenAPI path: ${matchedPath} for method: ${reqMethod}`);

        // Find a suitable response (e.g., 200, 201, 204)
        const responseCodes = Object.keys(operation.responses).sort();
        let chosenResponseCode = null;
        for (const code of responseCodes) {
            if (code.startsWith('2')) { // Prioritize 2xx responses
                chosenResponseCode = code;
                break;
            }
        }

        if (chosenResponseCode) {
            const response = operation.responses[chosenResponseCode];
            const content = response.content;

            if (content) {
                // Prioritize application/json content type
                const jsonContent = content['application/json'];
                if (jsonContent) {
                    // Prioritize examples defined at the response content level
                    if (jsonContent.examples) {
                        const exampleKey = Object.keys(jsonContent.examples)[0];
                        if (exampleKey) {
                            console.log(`Returning example from response content for ${chosenResponseCode}`);
                            return res.status(parseInt(chosenResponseCode, 10)).json(jsonContent.examples[exampleKey].value);
                        }
                    }
                    // Prioritize example defined at the schema level
                    if (jsonContent.schema && jsonContent.schema.example !== undefined) {
                        console.log(`Returning example from schema for ${chosenResponseCode}`);
                        return res.status(parseInt(chosenResponseCode, 10)).json(jsonContent.schema.example);
                    }
                    // Generate from schema if no explicit example
                    if (jsonContent.schema) {
                        console.log(`Generating mock response from schema for ${chosenResponseCode}`);
                        const mockData = generateMockResponse(jsonContent.schema);
                        return res.status(parseInt(chosenResponseCode, 10)).json(mockData);
                    }
                }
                // Fallback for other content types (e.g., text/plain, application/xml)
                // For simplicity, we'll just return an empty response for now.
                console.log(`No application/json content found or no schema/example. Returning empty ${chosenResponseCode}.`);
                return res.status(parseInt(chosenResponseCode, 10)).send();
            }
            // If no content defined for the response, just return an empty 2xx response
            console.log(`No content defined for response ${chosenResponseCode}. Returning empty.`);
            return res.status(parseInt(chosenResponseCode, 10)).send();

        } else {
            console.warn(`No 2xx response defined for ${reqMethod.toUpperCase()} ${matchedPath}. Returning 404.`);
            return res.status(404).json({ message: `No 2xx response defined for ${reqMethod.toUpperCase()} ${reqPath} in OpenAPI spec.` });
        }
    } else {
        console.warn(`No matching OpenAPI path found for ${reqMethod.toUpperCase()} ${reqPath}. Returning 404.`);
        return res.status(404).json({ message: `No matching path or method found for ${reqMethod.toUpperCase()} ${reqPath} in OpenAPI spec.` });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Mock server running on http://localhost:${PORT}`);
    console.log(`OpenAPI spec available at http://localhost:${PORT}/openapi.json`);
});