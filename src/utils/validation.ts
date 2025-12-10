import { z, ZodSchema, ZodIssue } from 'zod';

/**
 * Custom error class for validation failures.
 * Provides access to the detailed Zod issues.
 */
export class ValidationError extends Error {
  public readonly issues: ZodIssue[];

  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Validates data against a given Zod schema.
 *
 * This function is a wrapper around Zod's `safeParse` method.
 * If validation fails, it throws a `ValidationError` containing
 * all detailed Zod issues. If successful, it returns the parsed data.
 *
 * @template T The expected type of the validated data.
 * @param schema The Zod schema to use for validation.
 * @param data The unknown data object to validate.
 * @returns The validated and type-inferred data.
 * @throws {ValidationError} If the data does not conform to the schema.
 *
 * @example
 * ```typescript
 * import { z, validate, ValidationError } from './validation';
 *
 * const userSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string().min(3),
 *   email: z.string().email(),
 *   age: z.number().int().positive().optional(),
 * });
 *
 * type User = z.infer<typeof userSchema>;
 *
 * try {
 *   const userData = {
 *     id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
 *     name: 'Alice',
 *     email: 'alice@example.com',
 *   };
 *   const validatedUser: User = validate(userSchema, userData);
 *   console.log('Validated user:', validatedUser);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Validation failed:', error.message);
 *     error.issues.forEach(issue => console.error(`- ${issue.path.join('.')}: ${issue.message}`));
 *   } else {
 *     console.error('An unexpected error occurred:', error);
 *   }
 * }
 * ```
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError('Request validation failed', result.error.issues);
  }

  return result.data;
}

/**
 * Re-export `z` from Zod for convenience, allowing other modules
 * to define schemas without directly importing Zod.
 */
export { z };