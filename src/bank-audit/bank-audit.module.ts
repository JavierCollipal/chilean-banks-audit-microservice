import { Module } from '@nestjs/common';
import { BankAuditController } from './bank-audit.controller';
import { BankAuditService } from './bank-audit.service';

/**
 * Bank Audit Module (RULE 5 - Orchestration ONLY)
 *
 * This module orchestrates the bank audit feature:
 * - Controller: REST API endpoints
 * - Service: Business logic and external interactions
 */
@Module({
  controllers: [BankAuditController],
  providers: [BankAuditService],
  exports: [BankAuditService],
})
export class BankAuditModule {}
