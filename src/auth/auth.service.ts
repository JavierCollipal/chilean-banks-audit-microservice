import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload, ApiKeyPayload, apiKeyConfig } from '../config/jwt.config';

/**
 * Authentication Service
 *
 * Sprint 3.6: JWT Infrastructure (Optional Authentication)
 *
 * Provides JWT token generation and validation
 * Supports both JWT tokens and API keys
 *
 * IMPORTANT: Authentication is OPTIONAL for educational purposes
 */
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  /**
   * Generate JWT token for a user
   *
   * @param payload - User information to encode in token
   * @returns JWT token string
   */
  async generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return this.jwtService.sign(payload);
  }

  /**
   * Verify and decode JWT token
   *
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate API key
   *
   * @param apiKey - API key from request header
   * @returns API key payload or null if invalid
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyPayload | null> {
    // Check if key has correct prefix
    if (!apiKey.startsWith(apiKeyConfig.keyPrefix)) {
      return null;
    }

    // Check if key is in allowed list
    const validKeys = apiKeyConfig.defaultKeys;
    if (validKeys.includes(apiKey)) {
      return {
        key: apiKey,
        name: 'Educational API Key',
        scope: ['read', 'write'],
      };
    }

    // Additional validation from environment
    const envKeys = process.env.API_KEYS?.split(',') || [];
    if (envKeys.includes(apiKey)) {
      return {
        key: apiKey,
        name: 'Custom API Key',
        scope: ['read', 'write', 'admin'],
      };
    }

    return null;
  }

  /**
   * Hash password for storage
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   *
   * @param password - Plain text password
   * @param hash - Hashed password from database
   * @returns True if password matches
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate educational demo token
   *
   * Creates a demo token for testing purposes
   * Valid for 24 hours
   */
  async generateDemoToken(): Promise<{
    token: string;
    expiresIn: string;
    user: Omit<JwtPayload, 'iat' | 'exp'>;
  }> {
    const demoUser: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: 'demo-user-123',
      username: 'demo',
      email: 'demo@educational.example',
      role: 'student',
    };

    const token = await this.generateToken(demoUser);

    return {
      token,
      expiresIn: '24h',
      user: demoUser,
    };
  }

  /**
   * Generate educational API key
   *
   * Creates a demo API key for testing
   */
  generateDemoApiKey(): string {
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    return `${apiKeyConfig.keyPrefix}demo_${randomSuffix}`;
  }

  /**
   * Get authentication info
   *
   * Returns information about authentication configuration
   */
  getAuthInfo() {
    return {
      jwtEnabled: true,
      apiKeyEnabled: true,
      authenticationRequired: process.env.AUTH_REQUIRED === 'true',
      allowAnonymous: process.env.AUTH_ALLOW_ANONYMOUS !== 'false',
      tokenExpiration: process.env.JWT_EXPIRES_IN || '24h',
      supportedMethods: ['JWT Bearer Token', 'API Key (X-API-Key header)'],
      educationalMode: {
        enabled: true,
        demoTokenAvailable: true,
        demoApiKeyAvailable: true,
        note: 'Authentication is optional for educational purposes',
      },
    };
  }
}
