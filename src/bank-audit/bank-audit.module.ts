import { Module } from '@nestjs/common';
import { BankAuditController } from './bank-audit.controller';
import { BankAuditService } from './bank-audit.service';
import { WebsocketsModule } from '../websockets/websockets.module';

/**
 * Bank Audit Module (RULE 5 - Orchestration ONLY)
 *
 * This module orchestrates the bank audit feature:
 * - Controller: REST API endpoints
 * - Service: Business logic and external interactions
 * - WebSocket integration for real-time audit progress
 */
@Module({
  imports: [WebsocketsModule],
  controllers: [BankAuditController],
  providers: [BankAuditService],
  exports: [BankAuditService],
})
export class BankAuditModule {}
