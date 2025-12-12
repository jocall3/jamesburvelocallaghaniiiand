/**
 * @file PhysicalMaterializer.ts
 * @brief Logic that maps XML 'Physical*' attributes (size, color, weight) to 3D object properties for the Digital Twin engine.
 */

/**
 * Helper function to parse a string that might contain a numeric value and an optional unit.
 * Examples: "10 cm", "5.5 kg", "200"
 * @param input The raw value, which can be a number or a string.
 * @returns An object containing `value` (number) and `unit` (string, optional), or undefined if parsing fails.
 */
function parseNumericValueWithUnit(input: any): { value?: number; unit?: string } | undefined {
    if (typeof input === 'number') {
        return { value: input };
    }
    if (typeof input !== 'string') {
        return undefined;
    }

    const trimmed = input.trim();
    // Regex to capture a number (integer or float) and an optional string unit following it.
    // Example: "10.5 m" -> value: 10.5, unit: "m"
    // Example: "200" -> value: 200, unit: undefined
    const match = trimmed.match(/^(\d+(\.\d+)?)\s*([a-zA-Z%Â²Â³Â°\/]+)?$/); // Added common unit chars

    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[3] ? match[3].trim() : undefined;
        return { value, unit };
    }

    // Fallback: if it's purely a numeric string without a unit pattern (e.g., "123.45")
    const numericValue = parseFloat(trimmed);
    if (!isNaN(numericValue) && trimmed === String(numericValue)) {
        return { value: numericValue };
    }

    return undefined;
}

/**
 * Interface representing the raw input data, typically parsed from XML features.
 * Keys are expected to be the 'Name' attribute of the XML Feature elements.
 */
interface RawFeatureData {
    [featureName: string]: any; // Values can be strings, numbers, etc.
}

/**
 * Interface for the raw input data, typically parsed from XML features.
 * Keys are expected to be the 'Name' attribute of the XML Feature elements.
 */
interface RawFeatureData {
    [featureName: string]: any; // Values can be strings, numbers, etc.
}

/**
 * Interface for the materialized physical dimensions of a 3D object.
 */
interface PhysicalDimensions {
    height?: number;
    width?: number;
    depth?: number;
    unit?: string; // Common unit for all dimensions (e.g., "meters")
}

/**
 * Interface for the complete set of materialized physical properties for a 3D object.
 * These properties are intended to be consumed by a Digital Twin engine.
 */
interface PhysicalMaterial {
    size?: number | string; // Could be a scalar value representing overall size, or a descriptive string.
    color?: string;         // e.g., "#RRGGBB", "red", "rgb(255,0,0)"
    weight?: number;
    weightUnit?: string;    // Unit for weight (e.g., "kg", "lbs")
    volume?: number;
    volumeUnit?: string;    // Unit for volume (e.g., "mÂ³", "liters")
    density?: number;
    densityUnit?: string;   // Unit for density (e.g., "kg/mÂ³")
    dimensions?: PhysicalDimensions;
}

/**
 * The PhysicalMaterializer class is responsible for transforming raw
 * physical attribute data (e.g., from XML features) into a structured
 * format suitable for a 3D Digital Twin engine.
 */
export class PhysicalMaterializer {

    /**
     * Materializes raw feature data into a structured PhysicalMaterial object.
     * It maps specific "Physical*" feature names to corresponding properties,
     * attempting to parse numeric values and units where applicable.
     * @param rawObjectData An object containing raw feature key-value pairs.
     * @returns A `PhysicalMaterial` object representing the materialized physical properties.
     */
    public materialize(rawObjectData: RawFeatureData): PhysicalMaterial {
        const material: PhysicalMaterial = {};

        // 1. Extract Color
        if (rawObjectData.PhysicalColor !== undefined && rawObjectData.PhysicalColor !== null && rawObjectData.PhysicalColor !== '') {
            material.color = String(rawObjectData.PhysicalColor);
        }

        // 2. Extract Generic Size
        if (rawObjectData.PhysicalSize !== undefined && rawObjectData.PhysicalSize !== null && rawObjectData.PhysicalSize !== '') {
            const parsedSize = parseNumericValueWithUnit(rawObjectData.PhysicalSize);
            if (parsedSize?.value !== undefined) {
                material.size = parsedSize.value;
            } else {
                material.size = String(rawObjectData.PhysicalSize); // Keep as string if not purely numeric
            }
        }

        // 3. Extract Weight
        const weightParsed = parseNumericValueWithUnit(rawObjectData.PhysicalWeight);
        if (weightParsed?.value !== undefined) {
            material.weight = weightParsed.value;
            material.weightUnit = weightParsed.unit;
        }

        // 4. Extract Dimensions (Height, Width, Depth)
        const dimensions: PhysicalDimensions = {};
        let primaryDimensionUnit: string | undefined;

        const extractDimensionPart = (featureName: string, targetKey: keyof PhysicalDimensions) => {
            const rawValue = rawObjectData[featureName];
            if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                const parsed = parseNumericValueWithUnit(rawValue);
                if (parsed?.value !== undefined) {
                    (dimensions as any)[targetKey] = parsed.value; // Assign to the dimension part
                    if (parsed.unit) {
                        if (!primaryDimensionUnit) {
                            primaryDimensionUnit = parsed.unit;
                        } else if (primaryDimensionUnit !== parsed.unit) {
                            // Log a warning or implement a conversion strategy if units are mixed
                            console.warn(`[PhysicalMaterializer] Mixed units detected for dimensions: ${primaryDimensionUnit} and ${parsed.unit}. Using first encountered unit.`);
                        }
                    }
                }
            }
        };

        extractDimensionPart('PhysicalHeight', 'height');
        extractDimensionPart('PhysicalWidth', 'width');
        extractDimensionPart('PhysicalDepth', 'depth');

        // Only add dimensions object if at least one dimension was found
        if (Object.keys(dimensions).some(k => (dimensions as any)[k] !== undefined)) {
            if (primaryDimensionUnit) {
                dimensions.unit = primaryDimensionUnit;
            }
            material.dimensions = dimensions;
        }

        // 5. Extract Volume
        const volumeParsed = parseNumericValueWithUnit(rawObjectData.PhysicalVolume);
        if (volumeParsed?.value !== undefined) {
            material.volume = volumeParsed.value;
            material.volumeUnit = volumeParsed.unit;
        }

        // 6. Extract Density
        const densityParsed = parseNumericValueWithUnit(rawObjectData.PhysicalDensity);
        if (densityParsed?.value !== undefined) {
            material.density = densityParsed.value;
            material.densityUnit = densityParsed.unit;
        }

        return material;
    }
}