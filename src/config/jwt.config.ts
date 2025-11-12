import { JwtModuleOptions } from '@nestjs/jwt';

/**
 * JWT Configuration for Optional Authentication
 *
 * Sprint 3.6: JWT Infrastructure
 *
 * IMPORTANT: Authentication is OPTIONAL for educational purposes
 * - Endpoints work without authentication by default
 * - Users can enable authentication by providing JWT token
 * - API keys can be used as alternative authentication method
 *
 * Security Note:
 * - JWT_SECRET should be strong and unique in production
 * - Change default secret in .env file
 * - Never commit JWT_SECRET to version control
 */

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'neko-arc-educational-secret-change-in-production',
  signOptions: {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '24h', // Token validity
    issuer: 'chilean-banks-audit-microservice',
    audience: 'educational-users',
  },
};

/**
 * API Key Configuration
 *
 * API keys provide simple authentication alternative to JWT
 * Useful for service-to-service communication
 */
export const apiKeyConfig = {
  // Header name for API key
  headerName: 'X-API-Key',

  // Default API keys (should be overridden via environment variable)
  defaultKeys: process.env.API_KEYS
    ? process.env.API_KEYS.split(',')
    : ['demo-key-12345', 'educational-key-67890'],

  // API key prefix for validation
  keyPrefix: 'cbam_', // Chilean Banks Audit Microservice

  // Key rotation period (optional)
  rotationDays: 90,
};

/**
 * Authentication Mode Configuration
 *
 * Controls whether authentication is required or optional
 */
export const authConfig = {
  // If true, authentication is required for all protected endpoints
  // If false, authentication is optional (educational mode)
  required: process.env.AUTH_REQUIRED === 'true',

  // If true, allows requests without authentication
  allowAnonymous: process.env.AUTH_ALLOW_ANONYMOUS !== 'false',

  // Rate limits for authenticated vs anonymous users
  rateLimits: {
    authenticated: {
      ttl: 60000, // 1 minute
      limit: 60, // 60 requests per minute
    },
    anonymous: {
      ttl: 60000, // 1 minute
      limit: 10, // 10 requests per minute (current default)
    },
  },
};

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  sub: string; // User ID
  email?: string;
  username: string;
  role?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * API Key Payload Interface
 */
export interface ApiKeyPayload {
  key: string;
  name?: string;
  scope?: string[];
}
