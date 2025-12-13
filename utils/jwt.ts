import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this'; // Use environment variable for production

interface JwtPayload {
  userId: string;
  // Add any other relevant claims you want to include in the token
  [key: string]: any;
}

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 * @param userId The ID of the user to generate the token for.
 * @param expiresIn The expiration time for the token (e.g., '1h', '7d'). Defaults to '1h'.
 * @returns The generated JWT string.
 */
export const generateToken = (userId: string, expiresIn: string = '1h'): string => {
  const payload: JwtPayload = { userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verifies a JSON Web Token (JWT).
 * @param token The JWT string to verify.
 * @returns The decoded payload if the token is valid, otherwise null.
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Ensure the decoded payload has the expected structure
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JwtPayload;
    }
    return null;
  } catch (error) {
    // Token is invalid or expired
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};

/**
 * Extracts the user ID from a JWT.
 * @param token The JWT string.
 * @returns The user ID if the token is valid and contains a userId, otherwise null.
 */
export const getUserIdFromToken = (token: string): string | null => {
  const decodedPayload = verifyToken(token);
  return decodedPayload ? decodedPayload.userId : null;
};