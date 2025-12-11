interface DigitalTwinAttribute {
  name: string;
  value: any;
  type?: string; // e.g., 'Text', 'Number', 'Date', 'Currency', 'Address'
  unit?: string; // e.g., 'kg', 'cm', 'USD'
  source?: string; // e.g., 'financial_system', 'IoT_sensor', 'CRM'
  description?: string; // Corresponds to the 'Description' attribute in the XML features
  userVisible?: boolean; // Corresponds to the 'UserVisible' attribute in the XML features
}

interface DigitalTwin {
  id: string;
  name: string;
  type: DigitalTwinType; // The primary type of the digital twin, e.g., 'Account', 'Product'
  description?: string;
  attributes: Map<string, DigitalTwinAttribute>; // Key by attribute name for easy access
  // Potentially add relationships to other digital twins
  // relationships?: DigitalTwinRelationship[];
}

type DigitalTwinType =
  | 'Account'
  | 'Person'
  | 'Product'
  | 'Place'
  | 'Event'
  | 'Project'
  | 'Currency'
  | 'Temporal' // Represents time-related data itself, or a complex time dimension object
  | 'Thing' // General category from XML schema
  | 'Organization'
  | 'CreativeWork'
  | 'Intangible'
  | 'Undefined'; // Default or catch-all for unknown types

/**
 * Raw data input for creating a Digital Twin.
 * Keys should ideally map to recognized feature names or common property names.
 */
interface RawDigitalTwinData {
  [key: string]: any;
}

/**
 * A helper function to create a standardized DigitalTwinAttribute object.
 */
function createDigitalTwinAttribute(
  name: string,
  value: any,
  type?: string,
  unit?: string,
  source?: string,
  description?: string,
  userVisible: boolean = true
): DigitalTwinAttribute {
  return { name, value, type, unit, source, description, userVisible };
}

/**
 * DigitalTwinFactory is responsible for instantiating Digital Twin objects.
 * It links raw data, potentially from various sources (financial, physical, etc.),
 * into a structured DigitalTwin representation based on a predefined schema or type.
 */
class DigitalTwinFactory {

  /**
   * Creates a new Digital Twin instance.
   *
   * @param id A unique identifier for the digital twin.
   * @param name A human-readable name for the digital twin.
   * @param type The primary type of the digital twin (e.g., 'Account', 'Product').
   * @param rawData The raw data to be incorporated into the digital twin's attributes.
   * @returns A new DigitalTwin object.
   */
  public createDigitalTwin(id: string, name: string, type: DigitalTwinType, rawData: RawDigitalTwinData): DigitalTwin {
    const attributes = new Map<string, DigitalTwinAttribute>();

    // Always include a description if available in rawData
    if (rawData.description) {
      attributes.set('description', createDigitalTwinAttribute('description', rawData.description, 'Text', undefined, undefined, 'A general description of the twin'));
    }

    // Process rawData based on the DigitalTwinType, mapping to schema-defined features
    // This switch statement demonstrates how different types of twins might prioritize
    // and standardize their attributes.
    switch (type) {
      case 'Account':
        if (rawData.accountNumber) {
          attributes.set('accountNumber', createDigitalTwinAttribute('accountNumber', rawData.accountNumber, 'Number', undefined, 'financial_system', 'Account Number'));
        }
        if (rawData.accountName) {
          attributes.set('accountName', createDigitalTwinAttribute('accountName', rawData.accountName, 'Text', undefined, 'financial_system', 'Account Name'));
        }
        if (rawData.accountType) {
          attributes.set('accountType', createDigitalTwinAttribute('accountType', rawData.accountType, 'Text', undefined, 'financial_system', 'Account Type'));
        }
        if (rawData.balance) {
          attributes.set('balance', createDigitalTwinAttribute('balance', rawData.balance, 'Currency', rawData.currencyCode || 'USD', 'financial_system', 'Account Balance'));
        }
        break;

      case 'Person':
        if (rawData.personFullName) {
          attributes.set('personFullName', createDigitalTwinAttribute('personFullName', rawData.personFullName, 'Text', undefined, 'crm_system', 'Person Full Name'));
        } else if (rawData.firstName || rawData.lastName) {
          attributes.set('personFirstName', createDigitalTwinAttribute('personFirstName', rawData.firstName, 'Text', undefined, 'crm_system', 'Person First Name'));
          attributes.set('personLastName', createDigitalTwinAttribute('personLastName', rawData.lastName, 'Text', undefined, 'crm_system', 'Person Last Name'));
        }
        if (rawData.email) {
          attributes.set('email', createDigitalTwinAttribute('email', rawData.email, 'Email', undefined, 'crm_system', 'Email Address'));
        }
        if (rawData.phone) {
          attributes.set('phone', createDigitalTwinAttribute('phone', rawData.phone, 'PhoneNumber', undefined, 'crm_system', 'Phone Number'));
        }
        if (rawData.gender) {
          attributes.set('gender', createDigitalTwinAttribute('gender', rawData.gender, 'Text', undefined, 'crm_system', "Person's Gender"));
        }
        break;

      case 'Product':
        if (rawData.productName) {
          attributes.set('productName', createDigitalTwinAttribute('productName', rawData.productName, 'Text', undefined, 'product_catalog', 'Product Name'));
        }
        if (rawData.productSKU) {
          attributes.set('productSKU', createDigitalTwinAttribute('productSKU', rawData.productSKU, 'Text', undefined, 'product_catalog', 'Product SKU'));
        }
        if (rawData.productCategory) {
          attributes.set('productCategory', createDigitalTwinAttribute('productCategory', rawData.productCategory, 'Text', undefined, 'product_catalog', 'Product Category'));
        }
        if (rawData.price) {
          attributes.set('price', createDigitalTwinAttribute('price', rawData.price, 'Currency', rawData.currencyCode || 'USD', 'product_catalog', 'Product Price'));
        }
        if (rawData.physicalWeight) {
          attributes.set('physicalWeight', createDigitalTwinAttribute('physicalWeight', rawData.physicalWeight, 'Number', 'kg', 'physical_sensor', 'Physical Weight'));
        }
        if (rawData.physicalColor) {
          attributes.set('physicalColor', createDigitalTwinAttribute('physicalColor', rawData.physicalColor, 'Text', undefined, 'description_data', 'Physical Color'));
        }
        if (rawData.physicalVolume) {
          attributes.set('physicalVolume', createDigitalTwinAttribute('physicalVolume', rawData.physicalVolume, 'Number', 'cubic_m', 'physical_sensor', 'Physical Volume'));
        }
        break;

      case 'Place':
        if (rawData.addressStreet) {
          attributes.set('addressStreet', createDigitalTwinAttribute('addressStreet', rawData.addressStreet, 'Text', undefined, 'location_db', 'Street Address'));
        }
        if (rawData.addressCity) {
          attributes.set('addressCity', createDigitalTwinAttribute('addressCity', rawData.addressCity, 'Text', undefined, 'location_db', 'City'));
        }
        if (rawData.addressStateOrProvince) {
          attributes.set('addressStateOrProvince', createDigitalTwinAttribute('addressStateOrProvince', rawData.addressStateOrProvince, 'Text', undefined, 'location_db', 'State or Province'));
        }
        if (rawData.addressZip) {
          attributes.set('addressZip', createDigitalTwinAttribute('addressZip', rawData.addressZip, 'Text', undefined, 'location_db', 'Zip/Postal Code'));
        }
        if (rawData.addressCountry) {
          attributes.set('addressCountry', createDigitalTwinAttribute('addressCountry', rawData.addressCountry, 'Text', undefined, 'location_db', 'Country/Region'));
        }
        if (rawData.geoCentroidX && rawData.geoCentroidY) {
          attributes.set('latitude', createDigitalTwinAttribute('latitude', rawData.geoCentroidY, 'Float', 'deg', 'geo_system', 'Geo Centroid Latitude'));
          attributes.set('longitude', createDigitalTwinAttribute('longitude', rawData.geoCentroidX, 'Float', 'deg', 'geo_system', 'Geo Centroid Longitude'));
        }
        break;

      case 'Project':
        if (rawData.projectName) {
          attributes.set('projectName', createDigitalTwinAttribute('projectName', rawData.projectName, 'Text', undefined, 'project_mgmt', 'Project Name'));
        }
        if (rawData.projectCode) {
          attributes.set('projectCode', createDigitalTwinAttribute('projectCode', rawData.projectCode, 'Text', undefined, 'project_mgmt', 'Project Code'));
        }
        if (rawData.projectStartDate) {
          attributes.set('projectStartDate', createDigitalTwinAttribute('projectStartDate', new Date(rawData.projectStartDate), 'Date', undefined, 'project_mgmt', 'Project Start Date'));
        }
        if (rawData.projectEndDate) {
          attributes.set('projectEndDate', createDigitalTwinAttribute('projectEndDate', new Date(rawData.projectEndDate), 'Date', undefined, 'project_mgmt', 'Project End Date'));
        }
        if (rawData.projectCompletion) {
          attributes.set('projectCompletion', createDigitalTwinAttribute('projectCompletion', rawData.projectCompletion, 'Number', '%', 'project_mgmt', 'Project Completion Percentage'));
        }
        break;

      case 'Temporal':
        // Example for a twin representing a specific time unit or a temporal context
        if (rawData.year) attributes.set('year', createDigitalTwinAttribute('year', rawData.year, 'Integer', undefined, 'calendar_data', 'Year'));
        if (rawData.month) attributes.set('month', createDigitalTwinAttribute('month', rawData.month, 'Integer', undefined, 'calendar_data', 'Month'));
        if (rawData.day) attributes.set('day', createDigitalTwinAttribute('day', rawData.day, 'Integer', undefined, 'calendar_data', 'Day'));
        if (rawData.isHoliday !== undefined) attributes.set('isHoliday', createDigitalTwinAttribute('isHoliday', rawData.isHoliday, 'Boolean', undefined, 'calendar_data', 'Is Holiday'));
        break;

      default:
        // For 'Undefined' or other types, attempt to map all raw data keys
        // to generic attributes, inferring types where possible.
        for (const key in rawData) {
          if (Object.prototype.hasOwnProperty.call(rawData, key)) {
            // Avoid re-adding description if already processed, and skip id/name/type which are top-level
            if (!attributes.has(key) && key !== 'id' && key !== 'name' && key !== 'type' && key !== 'description') {
              let attrType: string = 'Text'; // Default to Text
              if (typeof rawData[key] === 'number') attrType = 'Number';
              else if (typeof rawData[key] === 'boolean') attrType = 'Boolean';
              else if (rawData[key] instanceof Date) attrType = 'Date';
              // More advanced type inference could use regex for emails, URLs, specific formats etc.

              attributes.set(key, createDigitalTwinAttribute(key, rawData[key], attrType, undefined, 'raw_data'));
            }
          }
        }
        break;
    }

    return {
      id,
      name,
      type,
      description: rawData.description,
      attributes,
    };
  }
}