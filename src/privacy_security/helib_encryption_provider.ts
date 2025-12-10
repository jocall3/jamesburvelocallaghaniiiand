```typescript
import { HEContext, HESecretKey, HESealedCipher, HECiphertext, createHEContext, generateKeys, encrypt, decrypt, add, multiply, scalarMultiply, negate } from './helib_wasm'; // Assuming WASM bindings exist

export class HElibEncryptionProvider {
  private context: HEContext | null = null;
  private publicKey: Uint8Array | null = null;
  private secretKey: HESecretKey | null = null;

  async initialize(params: {
    securityLevel: number; // e.g., 80
    m: number;  // cyclotomic polynomial order (power of 2)
    p: number; // plaintext prime (must be odd and coprime to m)
    r: number; // lifting (number of primes)
    bits: number; // bits per prime
  }): Promise<void> {
    try {
      this.context = await createHEContext(params.securityLevel, params.m, params.p, params.r, params.bits);
      if (!this.context) {
        throw new Error("Failed to create HElib context.");
      }
      const keys = await generateKeys(this.context);
      this.publicKey = keys.publicKey;
      this.secretKey = keys.secretKey;

    } catch (error) {
      console.error("HElib initialization error:", error);
      throw error;
    }
  }

  async encrypt(plaintext: number): Promise<HESealedCipher | null> {
    if (!this.context || !this.publicKey) {
      console.error("HElib not initialized or public key missing.");
      return null;
    }

    try {
      const ciphertext = await encrypt(this.context, this.publicKey, plaintext);
      return ciphertext;
    } catch (error) {
      console.error("HElib encryption error:", error);
      return null;
    }
  }


  async decrypt(ciphertext: HESealedCipher): Promise<number | null> {
    if (!this.context || !this.secretKey) {
      console.error("HElib not initialized or secret key missing.");
      return null;
    }
    try {
      const plaintext = await decrypt(this.context, this.secretKey, ciphertext);
      return plaintext;
    } catch (error) {
      console.error("HElib decryption error:", error);
      return null;
    }
  }

  async add(cipher1: HECiphertext, cipher2: HECiphertext): Promise<HECiphertext | null> {
      if (!this.context) {
          console.error("HElib not initialized.");
          return null;
      }
      try {
          const result = await add(this.context, cipher1, cipher2);
          return result;
      } catch (error) {
          console.error("HElib add error:", error);
          return null;
      }
  }

  async multiply(cipher1: HECiphertext, cipher2: HECiphertext): Promise<HECiphertext | null> {
    if (!this.context) {
        console.error("HElib not initialized.");
        return null;
    }
    try {
        const result = await multiply(this.context, cipher1, cipher2);
        return result;
    } catch (error) {
        console.error("HElib multiply error:", error);
        return null;
    }
  }


  async scalarMultiply(cipher: HECiphertext, scalar: number): Promise<HECiphertext | null> {
      if (!this.context) {
          console.error("HElib not initialized.");
          return null;
      }
      try {
          const result = await scalarMultiply(this.context, cipher, scalar);
          return result;
      } catch (error) {
          console.error("HElib scalarMultiply error:", error);
          return null;
      }
  }

  async negate(cipher: HECiphertext): Promise<HECiphertext | null> {
      if (!this.context) {
          console.error("HElib not initialized.");
          return null;
      }
      try {
          const result = await negate(this.context, cipher);
          return result;
      } catch (error) {
          console.error("HElib negate error:", error);
          return null;
      }
  }

  getPublicKey(): Uint8Array | null {
    return this.publicKey;
  }

  destroy(): void {
    if (this.context) {
      // Assuming context has a destroy method
      // this.context.destroy(); // Implement this in helib_wasm
      this.context = null;
    }
    if (this.secretKey) {
        //Assuming secretKey has a destroy method
        //this.secretKey.destroy();
        this.secretKey = null;
    }
  }
}
```