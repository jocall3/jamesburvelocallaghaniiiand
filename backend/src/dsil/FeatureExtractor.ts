export interface XmlNode {
    tagName: string;
    attributes: { [key: string]: string };
    children?: XmlNode[];
    text?: string;
}

export interface FeatureFlag {
    id: string;
    name: string;
    userVisible: boolean;
    description?: string;
    isExtractor: boolean;
    attributes: { [key: string]: string };
    children: FeatureFlag[];
}

export class FeatureExtractor {
    /**
     * Parses a raw XML node tree to extract Feature definitions hierarchy.
     * @param rootNode The root node of the parsed XML.
     * @returns An array of top-level FeatureFlags found in the tree.
     */
    public extractFeatures(rootNode: XmlNode): FeatureFlag[] {
        const features: FeatureFlag[] = [];
        this.traverseNodes(rootNode, features);
        return features;
    }

    /**
     * Recursively traverses the XML tree to find 'Feature' elements.
     * It handles the case where Feature elements might be nested deep within other structural tags.
     */
    private traverseNodes(node: XmlNode, parentCollection: FeatureFlag[]): void {
        if (node.tagName === 'Feature') {
            const feature = this.mapNodeToFeature(node);
            parentCollection.push(feature);
            // We do not continue traversing this node's children for *sibling* features in the parent collection.
            // The mapping function handles the children of this Feature.
            return;
        }

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                this.traverseNodes(child, parentCollection);
            }
        }
    }

    /**
     * Maps a single XML node to a FeatureFlag object, processing its children recursively.
     */
    private mapNodeToFeature(node: XmlNode): FeatureFlag {
        const subFeatures: FeatureFlag[] = [];
        
        if (node.children) {
            for (const child of node.children) {
                // If direct child is a Feature, map it.
                // If it's a wrapper, traverse it to find Features.
                this.traverseNodes(child, subFeatures);
            }
        }

        return {
            id: node.attributes['Id'] || '',
            name: node.attributes['Name'] || '',
            userVisible: node.attributes['UserVisible'] === 'true',
            description: node.attributes['Description'],
            isExtractor: node.attributes['FeatureExtractor'] === 'true',
            attributes: node.attributes,
            children: subFeatures
        };
    }

    /**
     * Flattens the feature tree to find a specific feature by Name.
     * @param features The list of features to search.
     * @param name The name of the feature to find.
     */
    public findFeatureByName(features: FeatureFlag[], name: string): FeatureFlag | undefined {
        for (const feature of features) {
            if (feature.name === name) {
                return feature;
            }
            const found = this.findFeatureByName(feature.children, name);
            if (found) return found;
        }
        return undefined;
    }

    /**
     * Flattens the feature tree to find a specific feature by ID.
     * @param features The list of features to search.
     * @param id The UUID/ID of the feature to find.
     */
    public findFeatureById(features: FeatureFlag[], id: string): FeatureFlag | undefined {
        for (const feature of features) {
            if (feature.id === id) {
                return feature;
            }
            const found = this.findFeatureById(feature.children, id);
            if (found) return found;
        }
        return undefined;
    }

    /**
     * Extracts specific capability flags used for dynamic system configuration.
     * Identifies presence of key features like PhysicalSize, GeoCentroid, etc.
     * This enables the system to dynamically toggle logic based on the schema definition.
     */
    public extractSystemCapabilities(features: FeatureFlag[]): Record<string, boolean> {
        const featureNames = this.flattenFeatureNames(features);
        
        return {
            hasPhysicalProperties: featureNames.has('PhysicalSize') || featureNames.has('PhysicalWeight'),
            hasGeoLocation: featureNames.has('GeoCentroidX') || featureNames.has('GeoBoundaryPolygon'),
            hasPersonEntity: featureNames.has('Person') || featureNames.has('PersonFullName'),
            hasAddressSchema: featureNames.has('AddressStreet') || featureNames.has('AddressCity'),
            hasCurrencySupport: featureNames.has('CurrencyISOcode') || featureNames.has('Currencyname'),
            hasProjectManagement: featureNames.has('Projectname') || featureNames.has('ProjectCode'),
            hasManufacturingCalendar: featureNames.has('ManufacturingDay'),
            hasFiscalCalendar: featureNames.has('FiscalYear'),
            hasReportingCalendar: featureNames.has('ReportingYear'),
            hasTimeDimension: featureNames.has('Years') || featureNames.has('Months') || featureNames.has('Days'),
            hasImageAssets: featureNames.has('ImageBmp') || featureNames.has('ImageJpg'),
            hasSlowlyChangingDimension: featureNames.has('ScdStartDate') || featureNames.has('ScdStatus')
        };
    }

    /**
     * Helper to collect all feature names into a Set for O(1) lookup.
     */
    private flattenFeatureNames(features: FeatureFlag[]): Set<string> {
        const names = new Set<string>();
        const stack = [...features];
        while (stack.length > 0) {
            const f = stack.pop();
            if (f) {
                names.add(f.name);
                if (f.children) {
                    stack.push(...f.children);
                }
            }
        }
        return names;
    }
}