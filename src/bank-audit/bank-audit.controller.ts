import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BankAuditService } from './bank-audit.service';
import { AuditBankDto, CreateBankDto } from './dto/audit-bank.dto';
import { IChileanBank, ISecurityAuditResult } from './interfaces/bank.interface';

/**
 * Bank Audit Controller - REST API Endpoints
 *
 * ETHICAL USE DISCLAIMER:
 * All endpoints are for educational cybersecurity research only.
 * This service performs defensive security analysis of publicly
 * accessible bank login pages. NO credential testing or unauthorized
 * access attempts are performed.
 */
@ApiTags('audit')
@Controller('audit')
export class BankAuditController {
  constructor(private readonly bankAuditService: BankAuditService) {}

  /**
   * Get all registered banks
   */
  @Get('banks')
  @ApiOperation({ summary: 'Get all registered Chilean banks' })
  @ApiResponse({
    status: 200,
    description: 'List of all banks available for auditing',
  })
  async getAllBanks(): Promise<IChileanBank[]> {
    return this.bankAuditService.getAllBanks();
  }

  /**
   * Get bank by code
   */
  @Get('banks/:code')
  @ApiOperation({ summary: 'Get bank details by code' })
  @ApiParam({
    name: 'code',
    description: 'Bank code (e.g., BCHILE, BESTADO)',
    example: 'BCHILE',
  })
  @ApiResponse({ status: 200, description: 'Bank details' })
  @ApiResponse({ status: 404, description: 'Bank not found' })
  async getBankByCode(@Param('code') code: string): Promise<IChileanBank> {
    return this.bankAuditService.getBankByCode(code);
  }

  /**
   * Create a new bank
   */
  @Post('banks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new Chilean bank for auditing' })
  @ApiResponse({ status: 201, description: 'Bank created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createBank(@Body() createBankDto: CreateBankDto): Promise<IChileanBank> {
    return this.bankAuditService.createBank(createBankDto);
  }

  /**
   * Audit a bank's login page security
   *
   * MAIN AUDIT ENDPOINT
   * Performs comprehensive security analysis:
   * - SSL/TLS configuration
   * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
   * - Authentication methods detection
   * - CSRF protection analysis
   * - Risk scoring and recommendations
   */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Audit a bank\'s login page security (EDUCATIONAL USE ONLY)',
    description:
      'Performs defensive security analysis of a Chilean bank login page. ' +
      'Analyzes SSL, headers, authentication methods, and CSRF protection. ' +
      'NO credential testing or unauthorized access attempts. ' +
      'For university cybersecurity courses only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Bank not found' })
  @ApiResponse({ status: 500, description: 'Audit failed' })
  async auditBank(@Body() auditBankDto: AuditBankDto): Promise<ISecurityAuditResult> {
    return this.bankAuditService.auditBank(
      auditBankDto.bankCode,
      auditBankDto.verbose || false,
    );
  }

  /**
   * Get audit history for a bank
   */
  @Get('history/:code')
  @ApiOperation({ summary: 'Get audit history for a bank' })
  @ApiParam({
    name: 'code',
    description: 'Bank code',
    example: 'BCHILE',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    example: 10,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Audit history retrieved' })
  @ApiResponse({ status: 404, description: 'Bank not found' })
  async getAuditHistory(
    @Param('code') code: string,
    @Query('limit') limit?: number,
  ): Promise<ISecurityAuditResult[]> {
    return this.bankAuditService.getAuditHistory(code, limit || 10);
  }

  /**
   * Service information
   */
  @Get('info')
  @ApiOperation({ summary: 'Get service information' })
  @ApiResponse({ status: 200, description: 'Service information' })
  getServiceInfo() {
    return {
      name: 'Chilean Banks Audit Microservice',
      version: '1.0.0',
      description: 'Educational cybersecurity research tool for analyzing Chilean bank login security',
      ethicalUse: {
        purpose: 'University cybersecurity course - Authorized research',
        capabilities: [
          'SSL/TLS analysis',
          'Security headers inspection',
          'Authentication methods detection',
          'CSRF protection analysis',
        ],
        prohibitions: [
          'NO credential testing',
          'NO unauthorized access attempts',
          'NO exploitation of vulnerabilities',
          'NO production use against live systems without authorization',
        ],
      },
      compliance: {
        rules: [
          'RULE 5: Microservices architecture',
          'RULE 10: Puppeteer visual mode (educational)',
          'RULE 11: Credential security (.env)',
          'RULE 47: MongoDB Atlas only',
        ],
      },
      personalities: {
        neko: 'Technical execution 🐾',
        mario: 'Puppeteer automation 🎭',
        noel: 'Testing & analysis 🗡️',
        glam: 'Ethics & advocacy 🎸',
        hannibal: 'Forensic analysis 🧠',
        tetora: 'Multi-perspective review 🧠',
      },
    };
  }
}
