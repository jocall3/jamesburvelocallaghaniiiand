import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 16; // 128 bits for AES-256-CBC

/**
 * Generates a random encryption key.
 * @returns A Buffer containing the encryption key.
 */
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypts a given plaintext string using AES-256-CBC.
 * @param plaintext The string to encrypt.
 * @param key The encryption key (Buffer).
 * @returns An object containing the encrypted data (base64 encoded) and the initialization vector (base64 encoded).
 * @throws Error if the key is not a Buffer or has an incorrect length.
 */
export function encryptData(plaintext: string, key: Buffer): { iv: string; encryptedData: string } {
  if (!Buffer.isBuffer(key) || key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be a Buffer of length ${KEY_LENGTH}.`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  return {
    iv: iv.toString('base64'),
    encryptedData: encrypted,
  };
}

/**
 * Decrypts data that was previously encrypted using AES-256-CBC.
 * @param encryptedData The base64 encoded encrypted data string.
 * @param iv The base64 encoded initialization vector string.
 * @param key The encryption key (Buffer).
 * @returns The original plaintext string.
 * @throws Error if the key is not a Buffer or has an incorrect length, or if decryption fails.
 */
export function decryptData(encryptedData: string, iv: string, key: Buffer): string {
  if (!Buffer.isBuffer(key) || key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be a Buffer of length ${KEY_LENGTH}.`);
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
  }
}

/**
 * A simple utility to securely store and retrieve data using encryption.
 * This is a basic example and might need more robust handling for production,
 * especially regarding key management.
 */
export class SecureDataHandler {
  private encryptionKey: Buffer;

  constructor(key: Buffer) {
    if (!Buffer.isBuffer(key) || key.length !== KEY_LENGTH) {
      throw new Error(`SecureDataHandler requires a valid encryption key of length ${KEY_LENGTH}.`);
    }
    this.encryptionKey = key;
  }

  /**
   * Encrypts and stores a value.
   * @param value The string value to encrypt.
   * @returns An object containing the IV and encrypted data.
   */
  public encrypt(value: string): { iv: string; encryptedData: string } {
    return encryptData(value, this.encryptionKey);
  }

  /**
   * Decrypts a stored value.
   * @param iv The base64 encoded IV.
   * @param encryptedData The base64 encoded encrypted data.
   * @returns The original decrypted string value.
   */
  public decrypt(iv: string, encryptedData: string): string {
    return decryptData(encryptedData, iv, this.encryptionKey);
  }
}