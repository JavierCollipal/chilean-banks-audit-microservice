import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankAuditModule } from './bank-audit/bank-audit.module';
import { HealthController } from './health/health.controller';

/**
 * Root Application Module (RULE 5 - Orchestration ONLY)
 *
 * This module orchestrates the application components:
 * - Configuration management
 * - Feature modules
 * - Health checks
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BankAuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
