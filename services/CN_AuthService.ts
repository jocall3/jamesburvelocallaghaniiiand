import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CN_UserService } from './CN_UserService'; // Assuming CN_UserService exists for user data operations
import { User } from '../types/User'; // Assuming a User type definition
import { AppConfig } from '../config/AppConfig'; // Assuming AppConfig for JWT secret and other settings

// --- Custom Error Definitions ---
/**
 * Base class for authentication-related errors.
 */
export class AuthError extends Error {
    public code: string;
    constructor(message: string, code: string = 'AUTH_ERROR') {
        super(message);
        this.name = 'AuthError';
        this.code = code;
        Object.setPrototypeOf(this, AuthError.prototype); // Correct prototype chain for instanceof
    }
}

/**
 * Error for invalid login credentials (email/password mismatch).
 */
export class InvalidCredentialsError extends AuthError {
    constructor(message: string = 'Invalid email or password.') {
        super(message, 'INVALID_CREDENTIALS');
        this.name = 'InvalidCredentialsError';
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}

/**
 * Error for when a user is not found in the system.
 */
export class UserNotFoundError extends AuthError {
    constructor(message: string = 'User not found.') {
        super(message, 'USER_NOT_FOUND');
        this.name = 'UserNotFoundError';
        Object.setPrototypeOf(this, UserNotFoundError.prototype);
    }
}

/**
 * Error for issues during JWT token verification (e.g., invalid, expired).
 */
export class TokenVerificationError extends AuthError {
    constructor(message: string = 'Invalid or expired token.') {
        super(message, 'TOKEN_VERIFICATION_FAILED');
        this.name = 'TokenVerificationError';
        Object.setPrototypeOf(this, TokenVerificationError.prototype);
    }
}

/**
 * Error for when a user tries to register with an email that already exists.
 */
export class UserAlreadyExistsError extends AuthError {
    constructor(message: string = 'User with this email already exists.') {
        super(message, 'USER_ALREADY_EXISTS');
        this.name = 'UserAlreadyExistsError';
        Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
    }
}

// --- CN_AuthService Class ---
export class CN_AuthService {
    private userService: CN_UserService;
    private jwtSecret: string;
    private jwtExpiresIn: string;
    private saltRounds: number;

    constructor() {
        // Initialize CN_UserService to interact with user data
        this.userService = new CN_UserService();

        // Retrieve JWT configuration from AppConfig
        this.jwtSecret = AppConfig.jwtSecret;
        this.jwtExpiresIn = AppConfig.jwtExpiresIn;
        this.saltRounds = AppConfig.bcryptSaltRounds; // e.g., 10 for production

        // Ensure JWT secret is configured
        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET is not defined in AppConfig. Please configure it.');
        }
        if (!this.jwtExpiresIn) {
            console.warn('JWT_EXPIRES_IN is not defined in AppConfig. Defaulting to "1h".');
            this.jwtExpiresIn = '1h'; // Default expiration
        }
        if (!this.saltRounds) {
            console.warn('BCRYPT_SALT_ROUNDS is not defined in AppConfig. Defaulting to 10.');
            this.saltRounds = 10; // Default salt rounds
        }
    }

    /**
     * Hashes a plain text password using bcrypt.
     * @param password The plain text password to hash.
     * @returns A promise that resolves with the hashed password.
     */
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compares a plain text password with a hashed password.
     * @param plainPassword The plain text password provided by the user.
     * @param hashedPassword The hashed password stored in the database.
     * @returns A promise that resolves to true if passwords match, false otherwise.
     */
    private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Generates a JSON Web Token (JWT) for a given user.
     * The token payload includes essential user information.
     * @param user The user object for whom the token is being generated.
     * @returns The generated JWT string.
     */
    private generateToken(user: User): string {
        const payload = {
            id: user.id,
            email: user.email,
            // Add other non-sensitive user data to the token payload as needed for authorization
            // e.g., roles: user.roles, subscriptionStatus: user.subscriptionStatus
        };
        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    }

    /**
     * Registers a new user in the system.
     * Hashes the password, creates the user record, and generates an authentication token.
     * @param email The user's email address.
     * @param password The user's chosen password (plain text).
     * @returns A promise that resolves with an object containing the new user and their JWT token.
     * @throws UserAlreadyExistsError if a user with the given email already exists.
     * @throws AuthError for other registration failures.
     */
    public async register(email: string, password: string): Promise<{ user: User; token: string }> {
        // Basic validation
        if (!email || !password) {
            throw new AuthError('Email and password are required for registration.', 'MISSING_CREDENTIALS');
        }

        // Check if a user with this email already exists
        const existingUser = await this.userService.findByEmail(email);
        if (existingUser) {
            throw new UserAlreadyExistsError();
        }

        // Hash the password before storing it
        const hashedPassword = await this.hashPassword(password);

        // Create the new user in the database
        const newUser = await this.userService.createUser(email, hashedPassword);

        // Generate a JWT token for the newly registered user
        const token = this.generateToken(newUser);

        return { user: newUser, token };
    }

    /**
     * Authenticates a user by verifying their email and password.
     * If credentials are valid, a new JWT token is generated.
     * @param email The user's email address.
     * @param password The user's password (plain text).
     * @returns A promise that resolves with an object containing the authenticated user and their JWT token.
     * @throws InvalidCredentialsError if the email or password is incorrect.
     * @throws UserNotFoundError if no user is found with the given email.
     */
    public async login(email: string, password: string): Promise<{ user: User; token: string }> {
        // Basic validation
        if (!email || !password) {
            throw new AuthError('Email and password are required for login.', 'MISSING_CREDENTIALS');
        }

        // Find the user by email
        const user = await this.userService.findByEmail(email);

        if (!user) {
            // For security, it's often better to return a generic "Invalid Credentials"
            // rather than "User Not Found" to prevent email enumeration attacks.
            throw new InvalidCredentialsError();
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await this.comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        // Generate a new JWT token for the authenticated user
        const token = this.generateToken(user);

        return { user, token };
    }

    /**
     * Verifies the authenticity and validity of a JWT token.
     * @param token The JWT string to verify.
     * @returns A promise that resolves with the decoded token payload if valid.
     * @throws TokenVerificationError if the token is invalid, expired, or malformed.
     */
    public async verifyToken(token: string): Promise<jwt.JwtPayload> {
        try {
            // Verify the token using the secret key
            const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenVerificationError('Authentication token has expired.');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new TokenVerificationError('Invalid authentication token.');
            }
            // Catch any other unexpected errors during verification
            throw new TokenVerificationError('Failed to verify authentication token.');
        }
    }

    /**
     * Refreshes an existing JWT token by generating a new one.
     * This method first verifies the old token to extract user information,
     * then fetches the user from the database to ensure they still exist and are active,
     * and finally issues a new token.
     *
     * NOTE: For a more robust refresh mechanism, consider using a separate, long-lived
     * refresh token stored securely (e.g., in an HTTP-only cookie) and a short-lived
     * access token. This implementation assumes the 'oldToken' is an access token
     * that might be nearing expiration but is still valid.
     *
     * @param oldToken The existing JWT token to refresh.
     * @returns A promise that resolves with a new JWT token string.
     * @throws TokenVerificationError if the old token is invalid or expired.
     * @throws UserNotFoundError if the user associated with the token is no longer found.
     */
    public async refreshToken(oldToken: string): Promise<string> {
        // Verify the old token to get the user ID. This will throw if the token is invalid or expired.
        const decoded = await this.verifyToken(oldToken);

        const userId = decoded.id;
        if (!userId) {
            throw new TokenVerificationError('Token payload is missing user ID.');
        }

        // Fetch the user from the database to ensure they still exist and are active
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new UserNotFoundError('User associated with the token no longer exists.');
        }

        // Generate and return a new token for the user
        return this.generateToken(user);
    }

    /**
     * Placeholder for a logout mechanism.
     * In a typical JWT setup, logout is primarily a client-side action
     * where the client simply discards the token.
     *
     * If server-side invalidation is required (e.g., for single-session control,
     * or to revoke a token immediately), it would involve maintaining a blacklist
     * or revocation list of tokens in the database, which adds significant complexity
     * and goes against the stateless nature of JWTs.
     *
     * For this project, we assume client-side token deletion is sufficient for logout.
     */
    public async logout(): Promise<void> {
        // No server-side action needed for stateless JWT logout.
        // The client is responsible for deleting the token.
        console.log('Client-side logout: Token should be discarded by the client.');
        return Promise.resolve();
    }
}