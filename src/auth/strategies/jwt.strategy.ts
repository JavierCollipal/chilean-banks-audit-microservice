import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../config/jwt.config';

/**
 * JWT Strategy for Passport
 *
 * Sprint 3.6: JWT Infrastructure
 *
 * Validates JWT tokens and extracts user information
 * Used by OptionalJwtGuard to authenticate requests
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Don't ignore expiration
      ignoreExpiration: false,

      // Secret key (same as used for signing)
      secretOrKey: process.env.JWT_SECRET || 'neko-arc-educational-secret-change-in-production',

      // Issuer validation
      issuer: 'chilean-banks-audit-microservice',

      // Audience validation
      audience: 'educational-users',
    });
  }

  /**
   * Validate JWT payload
   *
   * This method is called after token is verified
   * Return value is attached to request.user
   *
   * @param payload - Decoded JWT payload
   * @returns User object to attach to request
   */
  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role || 'student',
    };
  }
}
