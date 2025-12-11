import * as jose from 'jose';
import { Buffer } from 'buffer';

/**
 * Represents the header parameters of a JWE encrypted payload as defined in the OpenAPI schema.
 */
export interface EncryptedPayloadHeader {
  zip?: string;
  alg: string;
  enc: string;
  kid: string;
  x5c?: string[];
  cty?: string;
}

/**
 * Represents the complete JWE encrypted payload structure as defined in the OpenAPI schema
 * for an encrypted account number.
 */
export interface EncryptedPayload {
  header: EncryptedPayloadHeader;
  encrypted_key: string; // Base64url-encoded JWE Encrypted Key
  iv: string;            // Base64url-encoded JWE Initialization Vector
  ciphertext: string;    // Base64url-encoded JWE Ciphertext
  authTag: string;       // Base64url-encoded JWE Authentication Tag
  aad?: string;          // Optional Base64url-encoded JWE Additional Authenticated Data
}

/**
 * Configuration for the JWE decryption service.
 */
export interface RoutingNumberDecryptorConfig {
  /**
   * The PEM-encoded private RSA key used for JWE decryption.
   * This should be securely loaded from environment variables, a KMS,
   * or a secure file in a production environment.
   * Example: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
   */
  privateKeyPem: string;
}

/**
 * Handles the JWE decryption process to reveal clear-text account numbers
 * from encrypted API responses.
 */
export class RoutingNumberDecryptor {
  private privateKey: jose.KeyLike;

  /**
   * Private constructor to ensure that the class is instantiated asynchronously
   * via the static `create` factory method.
   * @param privateKey The loaded private key object.
   */
  private constructor(privateKey: jose.KeyLike) {
    this.privateKey = privateKey;
  }

  /**
   * Asynchronously creates and initializes a new `RoutingNumberDecryptor` instance.
   * This factory method handles the asynchronous loading and validation of the private key.
   *
   * @param config - Configuration object containing the PEM-encoded private key.
   * @returns A Promise that resolves to a new `RoutingNumberDecryptor` instance.
   * @throws {Error} if the private key cannot be imported or is invalid.
   */
  public static async create(config: RoutingNumberDecryptorConfig): Promise<RoutingNumberDecryptor> {
    try {
      // The OpenAPI specification examples indicate 'alg': 'RSA-OAEP-256' for key encryption.
      // `jose.importPKCS8` is suitable for importing PEM-encoded PKCS#8 private keys.
      const privateKey = await jose.importPKCS8(config.privateKeyPem, 'RSA-OAEP-256');
      return new RoutingNumberDecryptor(privateKey);
    } catch (error: any) {
      console.error('Failed to import private key for JWE decryption:', error);
      throw new Error(`Failed to initialize JWE decryptor: ${error.message || 'Invalid private key provided.'}`);
    }
  }

  /**
   * Decrypts a JWE payload to retrieve the clear-text account number.
   *
   * The `encryptedPayload` is expected to conform to the flattened JSON serialization
   * structure of JWE as described in RFC 7516 Section 7.2.2. The `header` field within
   * `encryptedPayload` is treated as the JWE Protected Header parameters.
   *
   * @param encryptedPayload The encrypted payload object received from the API response.
   *                         This object contains the JWE header, encrypted key,
   *                         initialization vector (IV), ciphertext, authentication tag,
   *                         and optional additional authenticated data (AAD).
   * @returns A Promise that resolves to the decrypted account number as a UTF-8 string.
   * @throws {Error} if the decryptor is not properly initialized, if decryption fails,
   *                 or if the provided payload is malformed.
   */
  public async decryptAccountNumber(encryptedPayload: EncryptedPayload): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Decryptor is not initialized: Private key is missing or not loaded.');
    }

    try {
      // The `header` object in the OpenAPI schema represents the JWE Protected Header.
      // It must be stringified and then base64url-encoded before being passed as the 'protected' field to `jose`.
      const protectedHeader = jose.base64url.encode(JSON.stringify(encryptedPayload.header));

      // Perform JWE decryption using the 'jose' library's `flattenedDecrypt` function.
      const { plaintext } = await jose.flattenedDecrypt(
        {
          protected: protectedHeader,
          encrypted_key: encryptedPayload.encrypted_key,
          iv: encryptedPayload.iv,
          ciphertext: encryptedPayload.ciphertext,
          tag: encryptedPayload.authTag, // The 'jose' library uses 'tag' for the JWE Authentication Tag
          aad: encryptedPayload.aad,      // Optional Additional Authenticated Data
        },
        this.privateKey,
      );

      // The `plaintext` result is a `Uint8Array`. Convert it to a UTF-8 string.
      return Buffer.from(plaintext).toString('utf8');
    } catch (error: any) {
      console.error('JWE decryption failed:', error);
      throw new Error(`Failed to decrypt account number: ${error.message || 'An unknown error occurred during decryption.'}`);
    }
  }
}