import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { BankAuditService } from './bank-audit.service';
import { AuditBankDto, CreateBankDto } from './dto/audit-bank.dto';
import { IChileanBank, ISecurityAuditResult } from './interfaces/bank.interface';
import { CacheKeys, CacheTTL, getInvalidationKeys } from '../config/cache.config';

/**
 * Bank Audit Controller - REST API Endpoints
 *
 * ETHICAL USE DISCLAIMER:
 * All endpoints are for educational cybersecurity research only.
 * This service performs defensive security analysis of publicly
 * accessible bank login pages. NO credential testing or unauthorized
 * access attempts are performed.
 *
 * Performance Features (Sprint 3.5):
 * - Caching: Bank data cached for 1 hour, audit results for 5 minutes
 * - Rate limiting: 10 requests per minute to prevent abuse
 * - Optimized MongoDB queries with proper indexing
 */
@ApiTags('audit')
@Controller('audit')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all endpoints
export class BankAuditController {
  constructor(
    private readonly bankAuditService: BankAuditService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get all registered banks
   * Cached for 1 hour for optimal performance
   */
  @Get('banks')
  @ApiOperation({ summary: 'Get all registered Chilean banks' })
  @ApiResponse({
    status: 200,
    description: 'List of all banks available for auditing',
  })
  @ApiHeader({
    name: 'X-Cache-Status',
    description: 'Cache hit status (HIT or MISS)',
    required: false,
  })
  async getAllBanks(): Promise<IChileanBank[]> {
    const cacheKey = CacheKeys.ALL_BANKS;

    // Check cache first
    const cached = await this.cacheManager.get<IChileanBank[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const banks = await this.bankAuditService.getAllBanks();

    // Store in cache
    await this.cacheManager.set(cacheKey, banks, CacheTTL.BANK_DATA);

    return banks;
  }

  /**
   * Get bank by code
   * Cached for 1 hour
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
    const cacheKey = CacheKeys.BANK_BY_CODE(code);

    // Check cache
    const cached = await this.cacheManager.get<IChileanBank>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const bank = await this.bankAuditService.getBankByCode(code);

    // Cache the result
    await this.cacheManager.set(cacheKey, bank, CacheTTL.SINGLE_BANK);

    return bank;
  }

  /**
   * Create a new bank
   * Invalidates bank list cache after creation
   */
  @Post('banks')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter limit for write operations
  @ApiOperation({ summary: 'Register a new Chilean bank for auditing' })
  @ApiResponse({ status: 201, description: 'Bank created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createBank(@Body() createBankDto: CreateBankDto): Promise<IChileanBank> {
    const bank = await this.bankAuditService.createBank(createBankDto);

    // Invalidate cache after creation
    await this.cacheManager.del(CacheKeys.ALL_BANKS);

    return bank;
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
   *
   * Performance:
   * - Cached for 5 minutes (security data changes slowly)
   * - Rate limited to 3 audits per minute (Puppeteer is resource-intensive)
   */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Strict limit for resource-intensive audits
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
  @ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Audit failed' })
  async auditBank(@Body() auditBankDto: AuditBankDto): Promise<ISecurityAuditResult> {
    const cacheKey = CacheKeys.AUDIT_RESULT(auditBankDto.bankCode);

    // Check cache (skip for verbose mode)
    if (!auditBankDto.verbose) {
      const cached = await this.cacheManager.get<ISecurityAuditResult>(cacheKey);
      if (cached) {
        return { ...cached, cached: true } as any;
      }
    }

    // Run audit (resource-intensive Puppeteer operation)
    const result = await this.bankAuditService.auditBank(
      auditBankDto.bankCode,
      auditBankDto.verbose || false,
    );

    // Cache the result (only if not verbose)
    if (!auditBankDto.verbose) {
      await this.cacheManager.set(cacheKey, result, CacheTTL.AUDIT_RESULT);
    }

    return result;
  }

  /**
   * Get audit history for a bank
   * Cached for 2 minutes
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
    const limitValue = limit || 10;
    const cacheKey = CacheKeys.AUDIT_HISTORY(code, limitValue);

    // Check cache
    const cached = await this.cacheManager.get<ISecurityAuditResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const history = await this.bankAuditService.getAuditHistory(code, limitValue);

    // Cache the result
    await this.cacheManager.set(cacheKey, history, CacheTTL.AUDIT_HISTORY);

    return history;
  }

  /**
   * Service information
   * Cached for 1 hour (static information)
   */
  @Get('info')
  @ApiOperation({ summary: 'Get service information' })
  @ApiResponse({ status: 200, description: 'Service information' })
  async getServiceInfo() {
    const cacheKey = CacheKeys.SERVICE_INFO;

    // Check cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build service info
    const info = {
      name: 'Chilean Banks Audit Microservice',
      version: '1.5.0',
      description: 'Educational cybersecurity research tool for analyzing Chilean bank login security',
      performance: {
        caching: 'Enabled (bank data: 1h, audit results: 5min)',
        rateLimiting: 'Enabled (10 req/min global, 3 req/min for audits)',
        compression: 'Enabled (gzip)',
      },
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

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, info, CacheTTL.SERVICE_INFO);

    return info;
  }
}
