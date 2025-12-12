import { ZodSchema, ZodTypeAny } from 'zod';
import Ajv, { ValidateFunction } from 'ajv';

export class SchemaValidator {
  /**
   * Validates data against a Zod schema.
   * @param schema The Zod schema to validate against.
   * @param data The data to validate.
   * @returns The validated data, or throws an error if validation fails.
   */
  static validateZod<T extends ZodTypeAny>(schema: ZodSchema<T>, data: any): T {
    try {
      return schema.parse(data);
    } catch (error: any) {
      // Re-throw with a more generic error message, potentially including details from ZodError
      throw new Error(`Zod validation failed: ${error.message}`);
    }
  }

  /**
   * Validates data against a JSON schema using Ajv.
   * @param schema The JSON schema to validate against.
   * @param data The data to validate.
   * @returns True if the data is valid, false otherwise.  Throws an error if schema compilation fails.
   */
  static validateAjv(schema: object, data: any): boolean {
    try {
      const ajv = new Ajv();
      const validate: ValidateFunction = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        // Re-throw with a more generic error message, potentially including details from Ajv errors
        throw new Error(`Ajv validation failed: ${ajv.errorsText(validate.errors)}`);
      }

      return true;
    } catch (error: any) {
      // Handle schema compilation errors or validation errors
      throw new Error(`Ajv validation failed: ${error.message}`);
    }
  }

  /**
   * Validates data against a JSON schema using Ajv with custom options.
   * @param schema The JSON schema to validate against.
   * @param data The data to validate.
   * @param options Ajv options.
   * @returns True if the data is valid, false otherwise.  Throws an error if schema compilation fails.
   */
  static validateAjvWithOptions(schema: object, data: any, options: Ajv['opts']): boolean {
    try {
      const ajv = new Ajv(options);
      const validate: ValidateFunction = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        // Re-throw with a more generic error message, potentially including details from Ajv errors
        throw new Error(`Ajv validation failed: ${ajv.errorsText(validate.errors)}`);
      }

      return true;
    } catch (error: any) {
      // Handle schema compilation errors or validation errors
      throw new Error(`Ajv validation failed: ${error.message}`);
    }
  }
}