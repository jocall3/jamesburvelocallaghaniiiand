import { Parser } from 'xml2js';

/**
 * Definition of an AttributeType in the schema.
 */
export interface AttributeTypeDefinition {
    name: string;
    datatype?: string; // Corresponds to dt:type
    values?: string[]; // Corresponds to dt:values
    default?: string;
    required?: boolean;
    description?: string;
}

/**
 * Reference to an attribute within an ElementType.
 */
export interface AttributeReference {
    typeName: string; // The name of the AttributeType
    required: boolean;
    default?: string;
}

/**
 * Reference to a child element within an ElementType or Group.
 */
export interface ElementReference {
    typeName: string; // The name of the ElementType
    minOccurs?: string;
    maxOccurs?: string;
}

/**
 * Group of elements within an ElementType.
 */
export interface GroupDefinition {
    order?: string; // e.g., seq, many, one
    minOccurs?: string;
    maxOccurs?: string;
    items: (ElementReference | GroupDefinition)[]; // Can contain elements or nested groups
}

/**
 * Definition of an ElementType in the schema.
 */
export interface ElementTypeDefinition {
    name: string;
    content?: string; // e.g., eltOnly, textOnly, empty, mixed
    model?: string; // e.g., closed, open
    order?: string; // e.g., seq, one, many (top level order)
    attributeRefs: AttributeReference[];
    childGroups: GroupDefinition[]; // Represents the structural hierarchy of children
}

/**
 * The full parsed Schema structure.
 */
export interface SchemaModel {
    name: string;
    xmlns: string;
    attributeTypes: Map<string, AttributeTypeDefinition>;
    elementTypes: Map<string, ElementTypeDefinition>;
}

export class SchemaParser {
    private parser: Parser;

    constructor() {
        this.parser = new Parser({
            explicitArray: true,
            mergeAttrs: false,
            explicitCharkey: true,
            // We keep attributes separately to parse XDR specifics like dt:type
        });
    }

    /**
     * Parses the 'asm.v1' XML schema structure into internal object definitions.
     * @param xmlContent The raw XML content of the schema file.
     * @returns A Promise resolving to the parsed SchemaModel.
     */
    public async parse(xmlContent: string): Promise<SchemaModel> {
        // Pre-processing: Extract the <Schema> block if the input contains surrounding garbage or multiple roots
        const cleanXml = this.extractSchemaXml(xmlContent);

        const result = await this.parser.parseStringPromise(cleanXml);

        // Locate the Schema root element
        let schemaRoot = result['Schema'];
        if (!schemaRoot && result['asmv1:Schema']) {
            schemaRoot = result['asmv1:Schema'];
        }

        if (!schemaRoot) {
            // Fallback: try to find any key that looks like a Schema
            const keys = Object.keys(result);
            const schemaKey = keys.find(k => k.endsWith('Schema'));
            if (schemaKey) {
                schemaRoot = result[schemaKey];
            } else {
                throw new Error("Invalid XML Schema: Root <Schema> element not found.");
            }
        }

        // Handle xml2js array wrapping
        const rootNode = Array.isArray(schemaRoot) ? schemaRoot[0] : schemaRoot;
        const rootAttrs = rootNode.$ || {};

        const model: SchemaModel = {
            name: rootAttrs.name || '',
            xmlns: rootAttrs.xmlns || '',
            attributeTypes: new Map<string, AttributeTypeDefinition>(),
            elementTypes: new Map<string, ElementTypeDefinition>()
        };

        // Parse AttributeTypes
        if (rootNode.AttributeType) {
            for (const atNode of rootNode.AttributeType) {
                const def = this.parseAttributeType(atNode);
                model.attributeTypes.set(def.name, def);
            }
        }

        // Parse ElementTypes
        if (rootNode.ElementType) {
            for (const etNode of rootNode.ElementType) {
                const def = this.parseElementType(etNode);
                model.elementTypes.set(def.name, def);
            }
        }

        return model;
    }

    /**
     * Helper to extract the Schema element if the file contains other manifests or text.
     */
    private extractSchemaXml(content: string): string {
        const startTag = '<Schema';
        const endTag = '</Schema>';
        const startIndex = content.indexOf(startTag);
        const endIndex = content.lastIndexOf(endTag);

        if (startIndex !== -1 && endIndex !== -1) {
            return content.substring(startIndex, endIndex + endTag.length);
        }
        return content;
    }

    private parseAttributeType(node: any): AttributeTypeDefinition {
        const attrs = node.$ || {};
        return {
            name: attrs.name,
            datatype: attrs['dt:type'],
            values: attrs['dt:values'] ? attrs['dt:values'].split(/\s+/) : undefined,
            default: attrs.default,
            required: attrs.required === 'yes',
            description: attrs.description
        };
    }

    private parseElementType(node: any): ElementTypeDefinition {
        const attrs = node.$ || {};
        const def: ElementTypeDefinition = {
            name: attrs.name,
            content: attrs.content,
            model: attrs.model,
            order: attrs.order,
            attributeRefs: [],
            childGroups: []
        };

        // Parse Attribute References
        if (node.attribute) {
            for (const attr of node.attribute) {
                const aAttrs = attr.$ || {};
                def.attributeRefs.push({
                    typeName: aAttrs.type,
                    required: aAttrs.required === 'yes',
                    default: aAttrs.default
                });
            }
        }

        // Parse Structure (Children: elements and groups)
        // We create a implicit root group to hold the direct children
        const rootGroup: GroupDefinition = {
            items: []
        };
        
        this.parseGroupChildren(node, rootGroup);

        if (rootGroup.items.length > 0) {
            def.childGroups.push(rootGroup);
        }

        return def;
    }

    private parseGroupChildren(node: any, parentGroup: GroupDefinition): void {
        // Handle 'element' references
        if (node.element) {
            for (const el of node.element) {
                const eAttrs = el.$ || {};
                parentGroup.items.push({
                    typeName: eAttrs.type,
                    minOccurs: eAttrs.minOccurs,
                    maxOccurs: eAttrs.maxOccurs
                } as ElementReference);
            }
        }

        // Handle nested 'group' definitions
        if (node.group) {
            for (const grp of node.group) {
                const gAttrs = grp.$ || {};
                const newGroup: GroupDefinition = {
                    order: gAttrs.order,
                    minOccurs: gAttrs.minOccurs,
                    maxOccurs: gAttrs.maxOccurs,
                    items: []
                };
                
                // Recursively parse children of this group
                this.parseGroupChildren(grp, newGroup);
                
                parentGroup.items.push(newGroup);
            }
        }
    }
}