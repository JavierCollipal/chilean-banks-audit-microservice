import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { BankAuditModule } from './bank-audit/bank-audit.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { PerformanceController } from './performance/performance.controller';
import { validate } from './config/env.validation';
import { cacheConfig } from './config/cache.config';

/**
 * Root Application Module (RULE 5 - Orchestration ONLY)
 *
 * This module orchestrates the application components:
 * - Configuration management with validation
 * - Caching layer for performance optimization
 * - Rate limiting to prevent API abuse
 * - Optional authentication (JWT & API keys)
 * - Performance monitoring
 * - Feature modules
 * - Health checks
 *
 * Environment validation ensures:
 * - RULE 11: No hardcoded credentials
 * - RULE 47: MongoDB Atlas only (except test env)
 * - All required variables are present
 *
 * Performance features (Sprint 3.5):
 * - Caching: Bank data (1h), Audit results (5min)
 * - Rate limiting: 10 requests/minute (global), 3 requests/minute (audits)
 * - Response compression: gzip level 6
 * - Performance monitoring: /performance/metrics endpoint
 *
 * Authentication features (Sprint 3.6):
 * - JWT token authentication (optional)
 * - API key authentication (optional)
 * - Demo tokens for educational testing
 * - Authentication is NOT required by default
 */
@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate, // Validate environment variables at startup
    }),

    // Caching for performance optimization
    CacheModule.register(cacheConfig),

    // Rate limiting to prevent API abuse
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window: 60 seconds
        limit: 10, // Max 10 requests per window
      },
    ]),

    // Authentication (optional)
    AuthModule,

    // Feature modules
    BankAuditModule,
  ],
  controllers: [HealthController, PerformanceController],
})
export class AppModule {}
