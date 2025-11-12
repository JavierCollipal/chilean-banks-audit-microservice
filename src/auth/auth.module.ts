import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig } from '../config/jwt.config';

/**
 * Authentication Module
 *
 * Sprint 3.6: JWT Infrastructure (Optional Authentication)
 *
 * Provides optional authentication via JWT tokens and API keys
 * All authentication is optional for educational purposes
 *
 * Features:
 * - JWT token generation and validation
 * - API key authentication
 * - Demo tokens for easy testing
 * - Optional authentication guards
 */
@Module({
  imports: [
    // Passport for authentication strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT module for token management
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
