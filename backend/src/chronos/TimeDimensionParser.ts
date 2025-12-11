import { TemporalFeature, TemporalDimension, FeatureType, DimensionType } from './TemporalEngine';

/**
 * Utility class to parse complex time dimension structures from a source 
 * (like the provided XML metadata snippet, although simplified here for processing).
 * This parser focuses on identifying and structuring features related to 
 * Fiscal, Manufacturing, and ISO8601 time dimensions.
 */
export class TimeDimensionParser {
    
    // Simplified structure representing relevant temporal features derived from the XML schema.
    private static temporalFeatureDefinitions = [
        // Standard Time Features (Included for context, even if not the primary focus)
        { id: '60cf8d70-4bdd-4a40-99ac-756a8f0a8961', name: 'Years', dimension: DimensionType.Standard, unit: 'Year' },
        { id: 'c6974fbe-7ca3-4196-a43b-c66325304a80', name: 'Months', dimension: DimensionType.Standard, unit: 'Month' },
        { id: '94e7e116-fa4f-4306-9851-1f66a35425b4', name: 'Days', dimension: DimensionType.Standard, unit: 'Day' },

        // Fiscal Time Features
        { id: '92e9b6f3-248b-4fad-a5f4-277718ec3eb8', name: 'FiscalDay', dimension: DimensionType.Fiscal, unit: 'Day' },
        { id: '648fab04-4511-4d17-81e6-858f21a45ad0', name: 'FiscalDayOfWeek', dimension: DimensionType.Fiscal, unit: 'DayOfWeek' },
        { id: 'ca522350-518c-4bb6-aff5-3e1d5013e5aa', name: 'FiscalDayOfMonth', dimension: DimensionType.Fiscal, unit: 'DayOfMonth' },
        { id: 'cf3bcb36-5672-472e-8fff-58901d34a406', name: 'FiscalDayOfYear', dimension: DimensionType.Fiscal, unit: 'DayOfYear' },
        { id: '9c01acee-2653-4303-b5d0-b0b0d15f681e', name: 'FiscalWeek', dimension: DimensionType.Fiscal, unit: 'Week' },
        { id: 'bac8510c-c1b1-49d2-814a-62a2cbbbec80', name: 'FiscalWeekOfYear', dimension: DimensionType.Fiscal, unit: 'WeekOfYear' },
        { id: 'f623ca19-f518-4cd2-9186-de6b26b3f06d', name: 'FiscalMonth', dimension: DimensionType.Fiscal, unit: 'Month' },
        { id: '62de8210-5341-4698-842d-c659c9decfee', name: 'FiscalMonthOfYear', dimension: DimensionType.Fiscal, unit: 'MonthOfYear' },
        { id: '3de753e4-18f9-4ff8-a983-adfb9bc280c1', name: 'FiscalQuarter', dimension: DimensionType.Fiscal, unit: 'Quarter' },
        { id: '70f2ed47-3462-42cc-8ed6-8e93454b7c34', name: 'FiscalQuarterOfYear', dimension: DimensionType.Fiscal, unit: 'QuarterOfYear' },
        { id: 'c87efea5-590c-4925-86cf-e025acff081d', name: 'FiscalYear', dimension: DimensionType.Fiscal, unit: 'Year' },

        // Manufacturing Time Features
        { id: 'a56f9d47-762f-4827-893c-a43f22185f1a', name: 'ManufacturingDay', dimension: DimensionType.Manufacturing, unit: 'Day' },
        { id: 'f0866558-4581-4f78-9e43-97aeaa2f007a', name: 'ManufacturingDayOfWeek', dimension: DimensionType.Manufacturing, unit: 'DayOfWeek' },
        { id: '57aadbc1-d7c7-44db-b57f-90a90c95a934', name: 'ManufacturingDayOfMonth', dimension: DimensionType.Manufacturing, unit: 'DayOfMonth' },
        { id: '1b13b1e9-bf7a-4650-b91d-cfc6ff8bdd80', name: 'ManufacturingDayOfYear', dimension: DimensionType.Manufacturing, unit: 'DayOfYear' },
        { id: '35c3b6ad-b1c6-4c13-bff6-ea91d89b6831', name: 'ManufacturingWeek', dimension: DimensionType.Manufacturing, unit: 'Week' },
        { id: 'e6593eb5-b049-4e2f-8648-b4e3880c0fd8', name: 'ManufacturingWeekOfYear', dimension: DimensionType.Manufacturing, unit: 'WeekOfYear' },
        { id: '56788e7c-2747-4b7f-9831-d4221c0a646f', name: 'ManufacturingMonth', dimension: DimensionType.Manufacturing, unit: 'Month' },
        { id: '7e34df01-28b8-48a6-822e-1153b9834996', name: 'ManufacturingMonthOfYear', dimension: DimensionType.Manufacturing, unit: 'MonthOfYear' },
        { id: '4b838336-8496-4170-bae9-0a4624f10200', name: 'ManufacturingQuarter', dimension: DimensionType.Manufacturing, unit: 'Quarter' },
        { id: '42bbda07-2d14-49f6-95c4-a575522ec9cc', name: 'ManufacturingQuarterOfYear', dimension: DimensionType.Manufacturing, unit: 'QuarterOfYear' },
        { id: '3fb6bf8a-f3ae-47b5-9c52-187139e8d293', name: 'ManufacturingYear', dimension: DimensionType.Manufacturing, unit: 'Year' },

        // ISO 8601 Time Features
        { id: 'f23b4f96-e8d8-4c6b-b1c3-40b3b2ee164f', name: 'ISO8601Year', dimension: DimensionType.ISO8601, unit: 'Year' },
        { id: 'c6e938ad-f69e-4ef8-b486-57e0334ee8e6', name: 'ISO8601Week', dimension: DimensionType.ISO8601, unit: 'Week' },
        { id: 'ac3c1427-7b8a-4a68-a5fe-0a816c39cd5c', name: 'ISO8601Days', dimension: DimensionType.ISO8601, unit: 'Day' },
        { id: '809a124d-a203-4b1b-b62b-173f3110ca69', name: 'ISO8601DayOfWeek', dimension: DimensionType.ISO8601, unit: 'DayOfWeek' },
        { id: '261f0572-f5f3-49bd-8aac-4db646fb2d1c', name: 'ISO8601DayOfYear', dimension: DimensionType.ISO8601, unit: 'DayOfYear' },
        { id: '072c3bda-2103-4979-a6a2-f5ff73b339f6', name: 'ISO8601WeekOfYear', dimension: DimensionType.ISO8601, unit: 'WeekOfYear' },
    ];

    /**
     * Parses the static definitions and structures them into TemporalDimension objects.
     * @returns An array of TemporalDimension representing the organized time features.
     */
    public static parseDimensions(): TemporalDimension[] {
        const dimensionsMap = new Map<DimensionType, TemporalDimension>();

        for (const def of TimeDimensionParser.temporalFeatureDefinitions) {
            const feature: TemporalFeature = {
                id: def.id,
                name: def.name,
                type: FeatureType.Temporal,
                unit: def.unit,
                sourceId: def.id, // In a real scenario, this might map to a database column or XML tag path
            };

            if (!dimensionsMap.has(def.dimension)) {
                // Initialize the dimension if it doesn't exist
                dimensionsMap.set(def.dimension, {
                    type: def.dimension,
                    name: this.getDimensionName(def.dimension),
                    features: [],
                });
            }

            // Add the feature to the corresponding dimension
            dimensionsMap.get(def.dimension)?.features.push(feature);
        }

        return Array.from(dimensionsMap.values());
    }

    /**
     * Helper to convert DimensionType enum to a human-readable name.
     */
    private static getDimensionName(type: DimensionType): string {
        switch (type) {
            case DimensionType.Standard:
                return "Standard Time";
            case DimensionType.Fiscal:
                return "Fiscal Calendar";
            case DimensionType.Manufacturing:
                return "Manufacturing Calendar";
            case DimensionType.ISO8601:
                return "ISO 8601 Standard";
            default:
                return "Unknown Dimension";
        }
    }
}

// Example of how the parser might be used to get the structured dimensions:
// const temporalDimensions = TimeDimensionParser.parseDimensions();
// console.log(temporalDimensions);
