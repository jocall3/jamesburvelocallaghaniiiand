import Ajv, { ErrorObject, Options, ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

/**
 * Interface representing the result of a validation operation.
 */
export interface ValidationResult {
  /** Whether the data is valid according to the schema. */
  valid: boolean;
  /** Raw error objects from the validator. */
  errors?: ErrorObject[] | null;
  /** Human-readable error messages. */
  formattedErrors?: string[];
}

/**
 * Core Schema Validator class.
 * 
 * This class wraps the AJV library configured for JSON Schema 2020-12,
 * which is the standard used by OpenAPI 3.1.0.
 * 
 * It handles registration of schemas, compilation, and validation of data
 * against those schemas. It is designed to support the massive scale of
 * 1000+ APIs by efficiently caching compiled validation functions.
 */
export class SchemaValidator {
  private ajv: Ajv;
  private compiledSchemas: Map<string, ValidateFunction>;

  /**
   * Initializes the SchemaValidator with OpenAPI 3.1.0 compatible settings.
   * @param options Optional AJV configuration overrides.
   */
  constructor(options: Options = {}) {
    // OpenAPI 3.1.0 uses JSON Schema 2020-12.
    // We disable 'strict' mode to allow OpenAPI-specific keywords (like 'xml', 'externalDocs', 'example')
    // that are not part of the core JSON Schema spec but are valid in OpenAPI documents.
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false, 
      discriminator: true, // Essential for OpenAPI polymorphism (oneOf/anyOf with discriminator)
      coerceTypes: true,   // Useful for query parameters where numbers might come as strings
      useDefaults: true,   // Apply default values defined in the schema
      ...options,
    });

    // Add standard formats (email, date-time, uuid, etc.)
    addFormats(this.ajv);
    
    this.compiledSchemas = new Map();
  }

  /**
   * Registers a schema globally within the validator instance.
   * This pre-compiles the schema for performance.
   * 
   * @param key A unique identifier for the schema (e.g., 'api_v1_login_request').
   * @param schema The OpenAPI 3.1.0 Schema Object.
   */
  public registerSchema(key: string, schema: object): void {
    try {
      // If schema exists, remove it first to allow hot-reloading/updates
      if (this.ajv.getSchema(key)) {
        this.ajv.removeSchema(key);
      }
      
      // Compile and cache
      const validate = this.ajv.compile(schema);
      this.compiledSchemas.set(key, validate);
      
      // Also add to AJV instance for reference resolution ($ref)
      this.ajv.addSchema(schema, key);
    } catch (error) {
      throw new Error(`SchemaValidator: Failed to register schema '${key}'. Details: ${(error as Error).message}`);
    }
  }

  /**
   * Validates a data object against a previously registered schema.
   * 
   * @param key The unique identifier of the registered schema.
   * @param data The data payload to validate.
   * @returns ValidationResult object containing success status and errors.
   */
  public validate(key: string, data: unknown): ValidationResult {
    const validate = this.compiledSchemas.get(key) || this.ajv.getSchema(key);

    if (!validate) {
      throw new Error(`SchemaValidator: Schema with key '${key}' not found. Ensure it is registered before validation.`);
    }

    const valid = validate(data);

    return {
      valid: !!valid,
      errors: validate.errors,
      formattedErrors: this.formatErrors(validate.errors),
    };
  }

  /**
   * Validates data against a raw schema object immediately without registering it.
   * Useful for dynamic validation of one-off schemas or workflow configurations.
   * 
   * @param schema The OpenAPI 3.1.0 Schema Object.
   * @param data The data payload to validate.
   * @returns ValidationResult object.
   */
  public validateRaw(schema: object, data: unknown): ValidationResult {
    try {
      const validate = this.ajv.compile(schema);
      const valid = validate(data);

      return {
        valid: !!valid,
        errors: validate.errors,
        formattedErrors: this.formatErrors(validate.errors),
      };
    } catch (error) {
      return {
        valid: false,
        formattedErrors: [`Schema compilation error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Removes a schema from the registry.
   * @param key The unique identifier of the schema.
   */
  public removeSchema(key: string): void {
    this.ajv.removeSchema(key);
    this.compiledSchemas.delete(key);
  }

  /**
   * Helper to format AJV error objects into human-readable strings.
   * @param errors Array of AJV ErrorObjects.
   */
  private formatErrors(errors?: ErrorObject[] | null): string[] {
    if (!errors) return [];
    return errors.map((err) => {
      const path = err.instancePath ? err.instancePath : 'root';
      return `${path}: ${err.message}`;
    });
  }

  /**
   * Returns the underlying AJV instance for advanced operations.
   */
  public getAjvInstance(): Ajv {
    return this.ajv;
  }
}