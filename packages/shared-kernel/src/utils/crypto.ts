import {
  scrypt,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHmac as nodeCreateHmac,
  createHash,
  generateKeyPair as nodeGenerateKeyPair,
  publicEncrypt,
  privateDecrypt,
  createSign,
  createVerify,
  timingSafeEqual,
  constants as cryptoConstants,
} from 'crypto';
import { promisify } from 'util';

// Promisify crypto functions for async/await usage
const scryptAsync = promisify(scrypt);
const generateKeyPairAsync = promisify(nodeGenerateKeyPair);

/**
 * Custom error class for cryptographic operations.
 */
export class CryptoError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'CryptoError';
  }
}

// --- Configuration Constants ---

// For symmetric encryption (AES-256-GCM)
const SYMMETRIC_ALGORITHM = 'aes-256-gcm';
const SYMMETRIC_KEY_LENGTH = 32; // 32 bytes = 256 bits
const IV_LENGTH = 16; // 16 bytes for GCM is a standard
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag

// For hashing
const HASH_ALGORITHM = 'sha512';
const HMAC_ALGORITHM = 'sha512';

// For password hashing (scrypt)
const SCRYPT_SALT_LENGTH = 16;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384, // CPU/memory cost factor
  r: 8,     // Block size factor
  p: 1,     // Parallelization factor
};

// For asymmetric encryption (RSA)
const ASYMMETRIC_KEY_TYPE = 'rsa';
const ASYMMETRIC_KEY_OPTIONS = {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
} as const;

// For digital signatures
const SIGNATURE_ALGORITHM = 'sha512';

// --- Helper Functions ---

/**
 * Generates a buffer of cryptographically secure random bytes.
 * @param size - The number of bytes to generate.
 * @returns A Buffer containing random bytes.
 */
export const generateRandomBytes = (size: number): Buffer => {
  return randomBytes(size);
};

/**
 * Securely compares two buffers in constant time to prevent timing attacks.
 * @param a - The first buffer.
 * @param b - The second buffer.
 * @returns True if the buffers are equal, false otherwise.
 */
export const secureCompare = (a: Buffer, b: Buffer): boolean => {
  if (a.length !== b.length) {
    // To prevent leaking length information, we compare b with itself.
    // This ensures the timing is consistent regardless of the length mismatch.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
};


// --- Hashing ---

/**
 * Creates a SHA-512 hash of the given data.
 * @param data - The data to hash (string or Buffer).
 * @returns The hex-encoded hash string.
 */
export const hash = (data: string | Buffer): string => {
  return createHash(HASH_ALGORITHM).update(data).digest('hex');
};

/**
 * Hashes a password using scrypt, a password-based key derivation function.
 * @param password - The password to hash.
 * @returns A promise that resolves to the scrypt hash string (salt included).
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = generateRandomBytes(SCRYPT_SALT_LENGTH);
    const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS)) as Buffer;
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  } catch (error) {
    throw new CryptoError('Failed to hash password.', error);
  }
};

/**
 * Verifies a password against a scrypt hash.
 * @param password - The plaintext password to verify.
 * @param storedHash - The stored hash string from `hashPassword`.
 * @returns A promise that resolves to true if the password is correct, false otherwise.
 */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const [saltHex, keyHex] = storedHash.split(':');
    if (!saltHex || !keyHex) {
      return false; // Invalid hash format
    }
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');

    const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS)) as Buffer;

    return secureCompare(storedKey, derivedKey);
  } catch (error) {
    // Errors can occur from invalid hex strings or other issues.
    // In a security context, it's safest to treat these as a verification failure.
    console.error('Error during password verification:', error);
    return false;
  }
};


// --- Symmetric Encryption (AES-256-GCM) ---

/**
 * Encrypts a string using AES-256-GCM.
 * @param text - The plaintext string to encrypt.
 * @param key - A 32-byte (256-bit) encryption key as a Buffer.
 * @returns A string containing the IV, auth tag, and encrypted data, separated by ':', in hex format.
 *          Format: `iv:authTag:encryptedText`
 */
export const encryptSymmetric = (text: string, key: Buffer): string => {
  if (key.length !== SYMMETRIC_KEY_LENGTH) {
    throw new CryptoError(`Invalid key length. Expected ${SYMMETRIC_KEY_LENGTH} bytes.`);
  }
  try {
    const iv = generateRandomBytes(IV_LENGTH);
    const cipher = createCipheriv(SYMMETRIC_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    throw new CryptoError('Symmetric encryption failed.', error);
  }
};

/**
 * Decrypts a string encrypted with AES-256-GCM.
 * @param encryptedPayload - The encrypted string from `encryptSymmetric`.
 * @param key - The 32-byte (256-bit) encryption key used for encryption.
 * @returns The original plaintext string, or null if decryption fails (e.g., authentication error).
 */
export const decryptSymmetric = (encryptedPayload: string, key: Buffer): string | null => {
  if (key.length !== SYMMETRIC_KEY_LENGTH) {
    throw new CryptoError(`Invalid key length. Expected ${SYMMETRIC_KEY_LENGTH} bytes.`);
  }
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      // Invalid payload format
      return null;
    }
    const [ivHex, authTagHex, encryptedTextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encryptedTextHex, 'hex');

    const decipher = createDecipheriv(SYMMETRIC_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    // This catch block will handle authentication failures (tampering) and other errors.
    // For security, we don't leak the specific error, just return null.
    return null;
  }
};


// --- Key Generation & Derivation ---

/**
 * Generates a cryptographically secure 256-bit key for symmetric encryption.
 * @returns A 32-byte Buffer.
 */
export const generateSymmetricKey = (): Buffer => {
  return generateRandomBytes(SYMMETRIC_KEY_LENGTH);
};

/**
 * Derives a key from a password and salt using scrypt.
 * Useful for creating encryption keys from user passwords.
 * @param password - The user's password.
 * @param salt - A cryptographically secure salt (use `generateRandomBytes`).
 * @param keyLength - The desired length of the derived key in bytes. Defaults to 32 for AES-256.
 * @returns A promise that resolves to the derived key as a Buffer.
 */
export const deriveKeyFromPassword = async (
  password: string,
  salt: Buffer,
  keyLength: number = SYMMETRIC_KEY_LENGTH
): Promise<Buffer> => {
  try {
    return (await scryptAsync(password, salt, keyLength, SCRYPT_OPTIONS)) as Buffer;
  } catch (error) {
    throw new CryptoError('Failed to derive key from password.', error);
  }
};

/**
 * Generates an RSA public/private key pair.
 * @returns A promise that resolves to an object containing the PEM-encoded public and private keys.
 */
export const generateAsymmetricKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  try {
    return await generateKeyPairAsync(ASYMMETRIC_KEY_TYPE, ASYMMETRIC_KEY_OPTIONS);
  } catch (error) {
    throw new CryptoError('Failed to generate asymmetric key pair.', error);
  }
};


// --- Asymmetric Encryption (RSA) ---

/**
 * Encrypts data using an RSA public key.
 * @param data - The plaintext data to encrypt.
 * @param publicKey - The PEM-encoded RSA public key.
 * @returns The base64-encoded encrypted data.
 */
export const encryptAsymmetric = (data: string, publicKey: string): string => {
  try {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    throw new CryptoError('Asymmetric encryption failed.', error);
  }
};

/**
 * Decrypts data using an RSA private key.
 * @param encryptedData - The base64-encoded data from `encryptAsymmetric`.
 * @param privateKey - The PEM-encoded RSA private key.
 * @returns The original plaintext string.
 */
export const decryptAsymmetric = (encryptedData: string, privateKey: string): string => {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = privateDecrypt(
      {
        key: privateKey,
        padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return decrypted.toString('utf8');
  } catch (error) {
    throw new CryptoError('Asymmetric decryption failed.', error);
  }
};


// --- Digital Signatures ---

/**
 * Creates a digital signature for data using a private key.
 * @param data - The data to sign (string or Buffer).
 * @param privateKey - The PEM-encoded private key.
 * @returns The base64-encoded signature.
 */
export const sign = (data: string | Buffer, privateKey: string): string => {
  try {
    const signer = createSign(SIGNATURE_ALGORITHM);
    signer.update(data);
    signer.end();
    return signer.sign(privateKey, 'base64');
  } catch (error) {
    throw new CryptoError('Failed to create signature.', error);
  }
};

/**
 * Verifies a digital signature using a public key.
 * @param data - The original data that was signed.
 * @param signature - The base64-encoded signature to verify.
 * @param publicKey - The PEM-encoded public key corresponding to the private key used for signing.
 * @returns True if the signature is valid, false otherwise.
 */
export const verifySignature = (data: string | Buffer, signature: string, publicKey: string): boolean => {
  try {
    const verifier = createVerify(SIGNATURE_ALGORITHM);
    verifier.update(data);
    verifier.end();
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    // Treat any error during verification as a failure.
    return false;
  }
};


// --- HMAC (Hash-based Message Authentication Code) ---

/**
 * Creates an HMAC for a given piece of data using a secret key.
 * @param data - The data to authenticate.
 * @param key - The secret key.
 * @returns The hex-encoded HMAC string.
 */
export const createHmac = (data: string | Buffer, key: string | Buffer): string => {
  return nodeCreateHmac(HMAC_ALGORITHM, key).update(data).digest('hex');
};

/**
 * Verifies an HMAC in a timing-safe way.
 * @param data - The original data.
 * @param hmac - The HMAC to verify.
 * @param key - The secret key.
 * @returns True if the HMAC is valid, false otherwise.
 */
export const verifyHmac = (data: string | Buffer, hmac: string, key: string | Buffer): boolean => {
  const expectedHmac = createHmac(data, key);
  const expectedHmacBuffer = Buffer.from(expectedHmac, 'hex');
  const receivedHmacBuffer = Buffer.from(hmac, 'hex');

  return secureCompare(expectedHmacBuffer, receivedHmacBuffer);
};