/*
 * Copyright 2024 The EchoSystem Project Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IKeyManagementService } from './key_management_service';
import { IConfigService } from './config_service';
import { ILogger } from '@/core/sdk/observability/logging';
import { 
    UserIdentity, 
    ServiceIdentity, 
    EcosystemTokenPayload, 
    TokenOptions,
    TokenType
} from '@/core/sdk/identity/types';
import { 
    AuthenticationError, 
    InvalidTokenError, 
    TokenExpiredError as EcosystemTokenExpiredError, 
    ConfigurationError 
} from '@/core/sdk/errors';

/**
 * @class TokenIssuer
 * @description Responsible for issuing and validating JSON Web Tokens (JWTs) for the entire ecosystem.
 * This service centralizes token creation logic, ensuring consistency in claims, signing algorithms,
 * and key management practices. It integrates with a KeyManagementService to handle cryptographic
 * key rotation and retrieval, which is a critical security feature for a production-grade system.
 * The tension it embodies is **Control vs. Usability**: providing secure, short-lived, scoped tokens (Control)
 * while enabling seamless authentication across 75 services (Usability).
 */
export class TokenIssuer {
    private readonly configService: IConfigService;
    private readonly keyManagementService: IKeyManagementService;
    private readonly logger: ILogger;

    private readonly issuer: string;
    private readonly audience: string;
    private readonly algorithm: jwt.Algorithm;
    private readonly accessTokenTtl: number;
    private readonly serviceTokenTtl: number;

    constructor(
        configService: IConfigService,
        keyManagementService: IKeyManagementService,
        logger: ILogger
    ) {
        this.configService = configService;
        this.keyManagementService = keyManagementService;
        this.logger = logger.child({ service: 'TokenIssuer' });

        this.issuer = this.configService.get<string>('JWT_ISSUER');
        this.audience = this.configService.get<string>('JWT_AUDIENCE');
        const algo = this.configService.get<string>('JWT_ALGORITHM');
        this.accessTokenTtl = this.configService.get<number>('JWT_ACCESS_TOKEN_TTL_SECONDS');
        this.serviceTokenTtl = this.configService.get<number>('JWT_SERVICE_TOKEN_TTL_SECONDS');

        if (!this.issuer || !this.audience || !algo || !this.accessTokenTtl || !this.serviceTokenTtl) {
            throw new ConfigurationError('JWT configuration (Issuer, Audience, Algorithm, TTLs) is incomplete.');
        }
        
        this.algorithm = algo as jwt.Algorithm;

        this.logger.info('TokenIssuer initialized', {
            issuer: this.issuer,
            audience: this.audience,
            algorithm: this.algorithm,
        });
    }

    /**
     * Issues a new JWT for a user identity.
     * @param identity - The user identity object containing ID, tenant, roles, and permissions.
     * @param options - Optional parameters for token generation (e.g., custom TTL, session ID).
     * @returns A signed JWT string.
     * @throws {AuthenticationError} if token signing fails.
     */
    public async issueUserToken(identity: UserIdentity, options: TokenOptions = {}): Promise<string> {
        this.logger.debug('Issuing user token', { userId: identity.id, tenantId: identity.tenantId });

        const now = Math.floor(Date.now() / 1000);
        const ttl = options.ttl || this.accessTokenTtl;
        const expiresAt = now + ttl;

        const payload: EcosystemTokenPayload = {
            // Standard JWT claims (RFC 7519)
            iss: this.issuer,
            sub: identity.id,
            aud: this.audience,
            exp: expiresAt,
            nbf: now,
            iat: now,
            jti: uuidv4(),

            // Ecosystem-specific claims
            typ: TokenType.User,
            uid: identity.id,
            tid: identity.tenantId,
            rol: identity.roles,
            prm: identity.permissions,
            sid: options.sessionId || uuidv4(),
        };

        return this._signToken(payload);
    }

    /**
     * Issues a new JWT for a service identity (for machine-to-machine communication).
     * @param identity - The service identity object containing ID and scopes.
     * @param options - Optional parameters for token generation.
     * @returns A signed JWT string.
     * @throws {AuthenticationError} if token signing fails.
     */
    public async issueServiceToken(identity: ServiceIdentity, options: TokenOptions = {}): Promise<string> {
        this.logger.debug('Issuing service token', { serviceId: identity.id });

        const now = Math.floor(Date.now() / 1000);
        const ttl = options.ttl || this.serviceTokenTtl;
        const expiresAt = now + ttl;

        const payload: EcosystemTokenPayload = {
            // Standard JWT claims
            iss: this.issuer,
            sub: identity.id,
            aud: this.audience,
            exp: expiresAt,
            nbf: now,
            iat: now,
            jti: uuidv4(),

            // Ecosystem-specific claims
            typ: TokenType.Service,
            sid: identity.id, // Service ID
            scp: identity.scopes, // Scopes for M2M auth
        };

        return this._signToken(payload);
    }

    /**
     * Validates a JWT string.
     * Verifies the signature, expiration, issuer, and audience using the public key
     * corresponding to the token's `kid` header.
     * @param token - The JWT string to validate.
     * @returns The decoded token payload if valid.
     * @throws {InvalidTokenError} if the token is malformed or the signature is invalid.
     * @throws {EcosystemTokenExpiredError} if the token has expired.
     * @throws {AuthenticationError} for other validation failures.
     */
    public async validateToken(token: string): Promise<EcosystemTokenPayload> {
        this.logger.debug('Attempting to validate token');

        try {
            const decodedHeader = jwt.decode(token, { complete: true });
            if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header.kid) {
                throw new InvalidTokenError('Token is malformed or missing Key ID (kid) in header.');
            }

            const keyId = decodedHeader.header.kid;
            const publicKey = await this.keyManagementService.getPublicKey(keyId);

            if (!publicKey) {
                this.logger.warn('Public key not found for validation', { keyId });
                throw new InvalidTokenError(`Public key with id '${keyId}' not found. Key may have been rotated out.`);
            }

            const verifyOptions: VerifyOptions = {
                algorithms: [this.algorithm],
                issuer: this.issuer,
                audience: this.audience,
            };

            const decodedPayload = jwt.verify(token, publicKey, verifyOptions) as EcosystemTokenPayload;
            this.logger.debug('Token validation successful', { jti: decodedPayload.jti, sub: decodedPayload.sub });
            return decodedPayload;

        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                this.logger.warn('Token validation failed: expired', { error: error.message, expiredAt: error.expiredAt });
                throw new EcosystemTokenExpiredError(error.message, error.expiredAt);
            }
            if (error instanceof jwt.JsonWebTokenError) {
                this.logger.warn('Token validation failed: invalid token', { error: error.message });
                throw new InvalidTokenError(error.message);
            }
            if (error instanceof InvalidTokenError || error instanceof EcosystemTokenExpiredError) {
                throw error;
            }
            this.logger.error('An unexpected error occurred during token validation', { error });
            throw new AuthenticationError('Failed to validate token due to an internal server error.');
        }
    }

    /**
     * Refreshes an access token based on an existing valid payload.
     * This method is intended to be called after a refresh token has been validated by a separate service.
     * It re-issues a new short-lived access token using the identity information from the old token's payload.
     * @param existingPayload - The payload of the token to be refreshed.
     * @returns A new signed JWT string.
     * @throws {InvalidTokenError} if the payload is malformed or of an unsupported type.
     */
    public async refreshToken(existingPayload: EcosystemTokenPayload): Promise<string> {
        this.logger.info('Refreshing token', { jti: existingPayload.jti, sub: existingPayload.sub });

        if (existingPayload.typ === TokenType.User && existingPayload.uid && existingPayload.tid) {
            const identity: UserIdentity = {
                id: existingPayload.uid,
                tenantId: existingPayload.tid,
                roles: existingPayload.rol || [],
                permissions: existingPayload.prm || [],
            };
            // Preserve the original session ID to maintain session continuity
            return this.issueUserToken(identity, { sessionId: existingPayload.sid });
        } else if (existingPayload.typ === TokenType.Service && existingPayload.sid) {
             const identity: ServiceIdentity = {
                id: existingPayload.sid,
                scopes: existingPayload.scp || [],
            };
            return this.issueServiceToken(identity);
        } else {
            this.logger.warn('Attempted to refresh a token with a malformed payload', { payload: existingPayload });
            throw new InvalidTokenError('Cannot refresh token: payload is malformed or of an unsupported type.');
        }
    }

    /**
     * Private helper to sign a token payload.
     * It retrieves the current active private key and its ID from the KeyManagementService,
     * adds the ID to the token header (`kid`), and signs the payload.
     * @param payload - The payload to sign.
     * @returns A signed JWT string.
     * @throws {AuthenticationError} if key retrieval or signing fails.
     */
    private async _signToken(payload: EcosystemTokenPayload): Promise<string> {
        try {
            const { key: privateKey, keyId } = await this.keyManagementService.getCurrentSigningKey();

            const signOptions: SignOptions = {
                algorithm: this.algorithm,
                keyid: keyId,
            };

            const token = jwt.sign(payload, privateKey, signOptions);
            this.logger.info('Token signed successfully', { jti: payload.jti, keyId, sub: payload.sub });
            return token;
        } catch (error) {
            this.logger.error('Failed to sign token', { error, jti: payload.jti });
            throw new AuthenticationError('Could not sign token due to an internal key management or signing error.');
        }
    }
}