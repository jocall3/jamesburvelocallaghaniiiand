import { XMLParser } from 'fast-xml-parser';

export interface ValidationError {
    path: string;
    message: string;
}

interface AttributeDefinition {
    name: string;
    dataType: string;
    values?: string[]; // for enumeration
}

interface ElementDefinition {
    name: string;
    model: 'closed' | 'open';
    content: 'eltOnly' | 'textOnly' | 'empty' | 'mixed';
    order: 'seq' | 'one' | 'many';
    attributes: Record<string, { required: boolean }>;
    allowedChildren: Set<string>;
}

export class ValidationService {
    private attributeDefinitions: Map<string, AttributeDefinition> = new Map();
    private elementDefinitions: Map<string, ElementDefinition> = new Map();
    private schemaParser: XMLParser;
    private dataParser: XMLParser;

    constructor() {
        // Parser configured for Schema ingestion (ignoring order, enforcing arrays)
        this.schemaParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            isArray: (name, jpath) => true,
            allowBooleanAttributes: true
        });

        // Parser configured for Data validation (preserving order for structure checks)
        this.dataParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            preserveOrder: true,
            parseAttributeValue: true,
            allowBooleanAttributes: true
        });
    }

    /**
     * Loads and parses an XDR-like XML Schema.
     * @param schemaXml The raw XML string of the schema.
     */
    public loadSchema(schemaXml: string): void {
        const parsed = this.schemaParser.parse(schemaXml);
        
        // Handle Schema root flexibility
        let root = parsed.Schema ? parsed.Schema[0] : null;
        if (!root && parsed.application) {
            // Fallback if wrapped in application manifest
             root = parsed; 
        }
        
        if (!root && parsed['?xml']) {
             // Try to find root Schema node
             const keys = Object.keys(parsed).filter(k => k !== '?xml');
             if(keys.includes('Schema')) root = parsed.Schema[0];
        }

        if (!root || (!root.AttributeType && !root.ElementType)) {
            // If explicit Schema tag isn't root, maybe we search deeper or throw.
            // For the provided goal, <Schema> is a top level element alongside <application>.
            // We'll assume the provided text is a fragment or we parsed the <Schema> part.
            // If the input was the whole file, we might need to find Schema.
            if (parsed.Schema) root = parsed.Schema[0];
        }

        if (root.AttributeType) {
            this.parseAttributeTypes(root.AttributeType);
        }

        if (root.ElementType) {
            this.parseElementTypes(root.ElementType);
        }
    }

    private parseAttributeTypes(attributeTypes: any[]) {
        for (const attr of attributeTypes) {
            const name = attr['@_name'];
            const dataType = attr['@_dt:type'] || 'string';
            const valuesStr = attr['@_dt:values'];
            const values = valuesStr ? valuesStr.split(' ') : undefined;

            this.attributeDefinitions.set(name, {
                name,
                dataType,
                values
            });
        }
    }

    private parseElementTypes(elementTypes: any[]) {
        for (const el of elementTypes) {
            const name = el['@_name'];
            const model = el['@_model'] || 'open';
            const content = el['@_content'] || 'mixed';
            const order = el['@_order'] || 'many';

            const attributes: Record<string, { required: boolean }> = {};
            const allowedChildren = new Set<string>();

            // Parse Attribute References
            if (el.attribute) {
                for (const attrRef of el.attribute) {
                    const refType = attrRef['@_type'];
                    const required = attrRef['@_required'] === 'yes';
                    attributes[refType] = { required };
                }
            }

            // Parse Child Elements (flattened for generic validation)
            const collectChildren = (container: any) => {
                if (container.element) {
                    container.element.forEach((childRef: any) => {
                        allowedChildren.add(childRef['@_type']);
                    });
                }
                if (container.group) {
                    container.group.forEach((group: any) => {
                        collectChildren(group);
                    });
                }
            };

            collectChildren(el);

            this.elementDefinitions.set(name, {
                name,
                model,
                content,
                order,
                attributes,
                allowedChildren
            });
        }
    }

    /**
     * Validates an XML data stream against the loaded schema.
     * @param xmlData The XML string to validate.
     * @returns Validation result with status and errors.
     */
    public validate(xmlData: string): { valid: boolean; errors: ValidationError[] } {
        const errors: ValidationError[] = [];
        let parsedData: any[];

        try {
            parsedData = this.dataParser.parse(xmlData);
        } catch (error: any) {
            return {
                valid: false,
                errors: [{ path: 'parser', message: `XML Parsing Error: ${error.message}` }]
            };
        }

        // Find root element (ignoring processing instructions)
        const rootObj = parsedData.find(node => {
            const key = Object.keys(node)[0];
            return key !== '?xml' && !key.startsWith('?');
        });

        if (!rootObj) {
            return { valid: false, errors: [{ path: 'root', message: 'No valid root element found in data.' }] };
        }

        const rootName = Object.keys(rootObj).filter(k => k !== ':@')[0];
        
        // Start recursive validation
        this.validateNode(rootName, rootObj[rootName], rootObj[':@'] || {}, errors, rootName);

        return {
            valid: errors.length === 0,
            errors
        };
    }

    private validateNode(tagName: string, children: any[], attributes: any, errors: ValidationError[], path: string) {
        const elementDef = this.elementDefinitions.get(tagName);

        if (!elementDef) {
            // Element definition not found. If Schema implies strict root, this is an error.
            // We report it as an error to be safe.
            errors.push({ path, message: `Element definition for '${tagName}' not found in schema.` });
            return;
        }

        // 1. Validate Attributes
        const normalizedAttrs: Record<string, any> = {};
        for (const key of Object.keys(attributes)) {
            normalizedAttrs[key.replace('@_', '')] = attributes[key];
        }

        // Check Required Attributes
        for (const [attrName, config] of Object.entries(elementDef.attributes)) {
            if (config.required && !(attrName in normalizedAttrs)) {
                errors.push({ path, message: `Missing required attribute: '${attrName}'.` });
            }
        }

        // Check Attribute Validity
        for (const [attrName, value] of Object.entries(normalizedAttrs)) {
            // Check if allowed (Closed model)
            if (elementDef.model === 'closed' && !elementDef.attributes[attrName]) {
                errors.push({ path, message: `Attribute '${attrName}' is not allowed on element '${tagName}'.` });
                continue;
            }

            // Validate Data Type / Enumeration
            const attrDef = this.attributeDefinitions.get(attrName);
            if (attrDef) {
                if (attrDef.dataType === 'enumeration' && attrDef.values) {
                    if (!attrDef.values.includes(String(value))) {
                        errors.push({ 
                            path, 
                            message: `Invalid value '${value}' for attribute '${attrName}'. Allowed: [${attrDef.values.join(', ')}]` 
                        });
                    }
                }
            }
        }

        // 2. Validate Content
        if (elementDef.content === 'empty') {
            const hasContent = children && children.some(c => {
                const k = Object.keys(c)[0];
                return k !== '#text' || (c[k] && c[k].toString().trim().length > 0);
            });
            if (hasContent) {
                errors.push({ path, message: `Element '${tagName}' must be empty.` });
            }
        }

        if (children) {
            for (const childNode of children) {
                const childTag = Object.keys(childNode).find(k => k !== ':@');
                if (!childTag) continue;

                if (childTag === '#text') {
                    const textContent = childNode[childTag].toString().trim();
                    if (elementDef.content === 'eltOnly' && textContent.length > 0) {
                        errors.push({ path, message: `Element '${tagName}' contains text but content type is 'eltOnly'.` });
                    }
                    continue;
                }

                // Check if Child Element is Allowed
                if (elementDef.model === 'closed' && !elementDef.allowedChildren.has(childTag)) {
                    errors.push({ path, message: `Child element '${childTag}' is not allowed in '${tagName}'.` });
                }

                // Recursive Validation
                this.validateNode(childTag, childNode[childTag], childNode[':@'] || {}, errors, `${path}/${childTag}`);
            }
        }
    }
}