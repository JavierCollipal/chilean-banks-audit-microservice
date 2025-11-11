import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';
import * as puppeteer from 'puppeteer';
import {
  IChileanBank,
  ISecurityAuditResult,
  ISSLAnalysis,
  ISecurityHeaders,
  IAuthenticationAnalysis,
  ICSRFAnalysis,
} from './interfaces/bank.interface';
import { CreateBankDto } from './dto/audit-bank.dto';

/**
 * Bank Audit Service (RULE 5 - External Interactions)
 *
 * Handles:
 * - MongoDB Atlas connections (RULE 47 - Atlas only, never localhost)
 * - Puppeteer browser automation (RULE 10 - headless: false, slowMo: 250, devtools: true)
 * - Security analysis (SSL, headers, CSRF, authentication)
 *
 * ETHICAL USE ONLY: Educational cybersecurity research
 * - NO credential testing
 * - NO unauthorized access attempts
 * - Defensive security analysis ONLY
 */
@Injectable()
export class BankAuditService {
  private readonly logger = new Logger(BankAuditService.name);
  private mongoClient: MongoClient;
  private db: Db;
  private banksCollection: Collection<IChileanBank>;
  private auditsCollection: Collection<ISecurityAuditResult>;

  constructor(private configService: ConfigService) {
    this.initializeMongoDB();
  }

  /**
   * Initialize MongoDB Atlas connection (RULE 47)
   */
  private async initializeMongoDB() {
    try {
      const mongoUri = this.configService.get<string>('MONGODB_URI');

      if (!mongoUri) {
        throw new Error('MONGODB_URI not configured in .env file');
      }

      if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        throw new Error(
          'RULE 47 Violation: MongoDB MCP must use Atlas URI, NEVER localhost!',
        );
      }

      this.mongoClient = new MongoClient(mongoUri);
      await this.mongoClient.connect();

      this.db = this.mongoClient.db('chilean-banks-audit');
      this.banksCollection = this.db.collection<IChileanBank>('banks');
      this.auditsCollection = this.db.collection<ISecurityAuditResult>('audits');

      // Create indexes
      await this.banksCollection.createIndex({ code: 1 }, { unique: true });
      await this.auditsCollection.createIndex({ bankCode: 1, timestamp: -1 });

      this.logger.log('✅ MongoDB Atlas connected successfully');
    } catch (error) {
      this.logger.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all banks
   */
  async getAllBanks(): Promise<IChileanBank[]> {
    return this.banksCollection.find().toArray();
  }

  /**
   * Get bank by code
   */
  async getBankByCode(code: string): Promise<IChileanBank> {
    const bank = await this.banksCollection.findOne({ code: code.toUpperCase() });
    if (!bank) {
      throw new NotFoundException(`Bank with code ${code} not found`);
    }
    return bank;
  }

  /**
   * Create a new bank
   */
  async createBank(createBankDto: CreateBankDto): Promise<IChileanBank> {
    const bank: IChileanBank = {
      ...createBankDto,
      code: createBankDto.code.toUpperCase(),
      active: createBankDto.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.banksCollection.insertOne(bank as any);
    return bank;
  }

  /**
   * Audit a bank's login page security (MAIN FUNCTION)
   *
   * ETHICAL USE: Educational analysis of publicly accessible login pages
   * - Analyzes SSL/TLS configuration
   * - Examines security headers
   * - Detects authentication methods (visual analysis only)
   * - Checks CSRF protection mechanisms
   */
  async auditBank(bankCode: string, verbose: boolean = false): Promise<ISecurityAuditResult> {
    const bank = await this.getBankByCode(bankCode);

    this.logger.log(`🔍 Starting security audit for ${bank.name} (${bank.code})`);

    const browser = await this.launchBrowser(verbose);

    try {
      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 - Educational Security Research',
      );

      // Enable request interception for header analysis
      await page.setRequestInterception(true);

      const requestHeaders: Record<string, string> = {};
      const responseHeaders: Record<string, string> = {};

      page.on('request', (request) => {
        Object.assign(requestHeaders, request.headers());
        request.continue();
      });

      page.on('response', (response) => {
        if (response.url() === bank.loginUrl) {
          Object.assign(responseHeaders, response.headers());
        }
      });

      // Navigate to login page
      const response = await page.goto(bank.loginUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      if (!response) {
        throw new Error('Failed to load page - no response received');
      }

      // Analyze SSL
      const ssl = await this.analyzeSSL(response, bank.loginUrl);

      // Analyze security headers
      const headers = this.analyzeSecurityHeaders(responseHeaders);

      // Analyze authentication methods (visual/DOM analysis)
      const authentication = await this.analyzeAuthentication(page);

      // Analyze CSRF protection
      const csrf = await this.analyzeCSRF(page);

      // Calculate risk score and recommendations
      const { riskScore, recommendations } = this.calculateRiskScore(
        ssl,
        headers,
        authentication,
        csrf,
      );

      const auditResult: ISecurityAuditResult = {
        bankCode: bank.code,
        bankName: bank.name,
        loginUrl: bank.loginUrl,
        timestamp: new Date(),
        ssl,
        headers,
        authentication,
        csrf,
        recommendations,
        riskScore,
        status: 'completed',
      };

      // Save audit result to MongoDB
      await this.auditsCollection.insertOne(auditResult as any);

      this.logger.log(`✅ Audit completed for ${bank.name} - Risk Score: ${riskScore}/100`);

      return auditResult;
    } catch (error) {
      this.logger.error(`❌ Audit failed for ${bank.name}:`, error.message);

      const failedResult: ISecurityAuditResult = {
        bankCode: bank.code,
        bankName: bank.name,
        loginUrl: bank.loginUrl,
        timestamp: new Date(),
        ssl: { enabled: false, grade: 'F', issues: ['Audit failed'] },
        headers: {
          strictTransportSecurity: false,
          contentSecurityPolicy: false,
          xFrameOptions: false,
          xContentTypeOptions: false,
          referrerPolicy: false,
          permissionsPolicy: false,
          headers: {},
          grade: 'F',
        },
        authentication: { methods: [], mfaAvailable: false, mfaTypes: [], passwordRequirements: [], sessionManagement: {}, grade: 'F' },
        csrf: { tokenPresent: false, isProtected: false, grade: 'F' },
        recommendations: ['Audit failed - please retry'],
        riskScore: 100,
        status: 'failed',
        error: error.message,
      };

      await this.auditsCollection.insertOne(failedResult as any);

      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Launch Puppeteer browser (RULE 10 - Visual mode for educational purposes)
   */
  private async launchBrowser(verbose: boolean): Promise<puppeteer.Browser> {
    const headless = this.configService.get<string>('PUPPETEER_HEADLESS') === 'true';
    const slowMo = parseInt(this.configService.get<string>('PUPPETEER_SLOW_MO') || '250');
    const devtools = this.configService.get<string>('PUPPETEER_DEVTOOLS') === 'true';

    return puppeteer.launch({
      headless, // RULE 10: false for educational demonstration
      slowMo, // RULE 10: 250ms for visibility
      devtools, // RULE 10: true for learning
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
  }

  /**
   * Analyze SSL/TLS configuration
   */
  private async analyzeSSL(
    response: puppeteer.HTTPResponse,
    url: string,
  ): Promise<ISSLAnalysis> {
    const issues: string[] = [];
    let grade: ISSLAnalysis['grade'] = 'A+';

    const isHTTPS = url.startsWith('https://');

    if (!isHTTPS) {
      issues.push('CRITICAL: Login page not served over HTTPS');
      grade = 'F';
      return { enabled: false, grade, issues };
    }

    // Check security details
    const securityDetails = response.securityDetails();

    if (!securityDetails) {
      issues.push('Unable to retrieve SSL certificate details');
      grade = 'C';
    }

    return {
      enabled: true,
      protocol: securityDetails?.protocol(),
      validCertificate: true, // Puppeteer validates automatically
      issuer: securityDetails?.issuer(),
      grade,
      issues,
    };
  }

  /**
   * Analyze security headers
   */
  private analyzeSecurityHeaders(headers: Record<string, string>): ISecurityHeaders {
    const lowerHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const analysis: ISecurityHeaders = {
      strictTransportSecurity: !!lowerHeaders['strict-transport-security'],
      contentSecurityPolicy: !!lowerHeaders['content-security-policy'],
      xFrameOptions: !!lowerHeaders['x-frame-options'],
      xContentTypeOptions: !!lowerHeaders['x-content-type-options'],
      referrerPolicy: !!lowerHeaders['referrer-policy'],
      permissionsPolicy: !!lowerHeaders['permissions-policy'],
      headers: lowerHeaders,
      grade: 'F',
    };

    // Calculate grade
    const score =
      (analysis.strictTransportSecurity ? 20 : 0) +
      (analysis.contentSecurityPolicy ? 25 : 0) +
      (analysis.xFrameOptions ? 15 : 0) +
      (analysis.xContentTypeOptions ? 15 : 0) +
      (analysis.referrerPolicy ? 10 : 0) +
      (analysis.permissionsPolicy ? 15 : 0);

    if (score >= 90) analysis.grade = 'A';
    else if (score >= 75) analysis.grade = 'B';
    else if (score >= 60) analysis.grade = 'C';
    else if (score >= 40) analysis.grade = 'D';

    return analysis;
  }

  /**
   * Analyze authentication methods (DOM analysis only - NO credential testing!)
   */
  private async analyzeAuthentication(page: puppeteer.Page): Promise<IAuthenticationAnalysis> {
    const methods: string[] = [];
    const passwordRequirements: string[] = [];
    let mfaAvailable = false;
    const mfaTypes: string[] = [];

    // Look for form elements
    const hasPasswordField = await page.$('input[type="password"]');
    const hasUsernameField = await page.$('input[type="text"], input[type="email"], input[name*="user"], input[name*="rut"]');

    if (hasPasswordField && hasUsernameField) {
      methods.push('username-password');
    }

    // Look for MFA indicators (text content, not actual implementation)
    const pageContent = await page.content();

    if (
      pageContent.includes('MFA') ||
      pageContent.includes('2FA') ||
      pageContent.includes('autenticación de dos factores') ||
      pageContent.includes('segundo factor') ||
      pageContent.includes('token') ||
      pageContent.includes('SMS') ||
      pageContent.includes('código')
    ) {
      mfaAvailable = true;
      mfaTypes.push('Detected via page content analysis');
    }

    // Session management analysis
    const cookies = await page.cookies();
    const sessionManagement = {
      secureFlag: cookies.some((c) => c.secure),
      httpOnlyFlag: cookies.some((c) => c.httpOnly),
    };

    // Calculate grade
    let grade: IAuthenticationAnalysis['grade'] = 'F';
    if (methods.length > 0 && mfaAvailable) grade = 'A';
    else if (methods.length > 0) grade = 'C';

    return {
      methods,
      mfaAvailable,
      mfaTypes,
      passwordRequirements,
      sessionManagement,
      grade,
    };
  }

  /**
   * Analyze CSRF protection (DOM analysis only)
   */
  private async analyzeCSRF(page: puppeteer.Page): Promise<ICSRFAnalysis> {
    // Look for CSRF tokens in forms
    const csrfToken = await page.$eval(
      'input[name*="csrf"], input[name*="token"], input[name*="_token"]',
      (el: HTMLInputElement) => el.value,
    ).catch(() => null);

    const tokenPresent = !!csrfToken;
    const isProtected = tokenPresent;

    return {
      tokenPresent,
      tokenType: tokenPresent ? 'hidden-field' : undefined,
      tokenValue: tokenPresent ? '[PRESENT]' : undefined,
      isProtected,
      grade: isProtected ? 'A' : 'F',
    };
  }

  /**
   * Calculate overall risk score and recommendations
   */
  private calculateRiskScore(
    ssl: ISSLAnalysis,
    headers: ISecurityHeaders,
    authentication: IAuthenticationAnalysis,
    csrf: ICSRFAnalysis,
  ): { riskScore: number; recommendations: string[] } {
    const recommendations: string[] = [];
    let riskScore = 0;

    // SSL analysis
    if (!ssl.enabled) {
      riskScore += 40;
      recommendations.push('CRITICAL: Implement HTTPS for login page');
    } else if (ssl.issues.length > 0) {
      riskScore += 10;
      recommendations.push('Review SSL/TLS configuration issues');
    }

    // Headers analysis
    if (!headers.strictTransportSecurity) {
      riskScore += 10;
      recommendations.push('Implement HSTS (Strict-Transport-Security header)');
    }
    if (!headers.contentSecurityPolicy) {
      riskScore += 10;
      recommendations.push('Implement Content Security Policy (CSP)');
    }
    if (!headers.xFrameOptions) {
      riskScore += 5;
      recommendations.push('Add X-Frame-Options header to prevent clickjacking');
    }

    // Authentication analysis
    if (!authentication.mfaAvailable) {
      riskScore += 15;
      recommendations.push('Implement Multi-Factor Authentication (MFA/2FA)');
    }

    // CSRF analysis
    if (!csrf.isProtected) {
      riskScore += 10;
      recommendations.push('Implement CSRF protection tokens');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Excellent security posture!');
    }

    return { riskScore, recommendations };
  }

  /**
   * Get audit history for a bank
   */
  async getAuditHistory(bankCode: string, limit: number = 10): Promise<ISecurityAuditResult[]> {
    return this.auditsCollection
      .find({ bankCode: bankCode.toUpperCase() })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.mongoClient) {
      await this.mongoClient.close();
      this.logger.log('MongoDB connection closed');
    }
  }
}
