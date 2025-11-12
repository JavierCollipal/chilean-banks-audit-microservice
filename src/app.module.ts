import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankAuditModule } from './bank-audit/bank-audit.module';
import { HealthController } from './health/health.controller';
import { validate } from './config/env.validation';

/**
 * Root Application Module (RULE 5 - Orchestration ONLY)
 *
 * This module orchestrates the application components:
 * - Configuration management with validation
 * - Feature modules
 * - Health checks
 *
 * Environment validation ensures:
 * - RULE 11: No hardcoded credentials
 * - RULE 47: MongoDB Atlas only (except test env)
 * - All required variables are present
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate, // Validate environment variables at startup
    }),
    BankAuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
