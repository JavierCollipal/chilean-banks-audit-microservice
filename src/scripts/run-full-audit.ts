import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BankAuditService } from '../bank-audit/bank-audit.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive Audit Runner with Error Collection
 *
 * This script runs Puppeteer audits on all Chilean banks step-by-step,
 * collecting errors and improving handling gradually.
 *
 * Features:
 * - Step-by-step audit execution
 * - Error collection and logging
 * - Screenshot capture on errors
 * - Progress reporting
 * - Result aggregation
 *
 * ETHICAL USE: Defensive analysis only, no credential testing
 */

interface AuditAttempt {
  bankCode: string;
  bankName: string;
  attempt: number;
  timestamp: Date;
  success: boolean;
  result?: any;
  error?: string;
  errorStack?: string;
  duration: number;
}

interface ErrorPattern {
  errorType: string;
  count: number;
  affectedBanks: string[];
  sampleMessage: string;
}

class AuditRunner {
  private auditService: BankAuditService;
  private attempts: AuditAttempt[] = [];
  private screenshotsDir: string;

  constructor(auditService: BankAuditService) {
    this.auditService = auditService;
    this.screenshotsDir = path.join(process.cwd(), 'audit-screenshots');

    // Create screenshots directory
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Run audit on a single bank with error handling
   */
  async auditBank(bankCode: string, attemptNumber: number = 1): Promise<AuditAttempt> {
    const startTime = Date.now();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏦 AUDITING: ${bankCode} (Attempt ${attemptNumber})`);
    console.log(`${'='.repeat(80)}\n`);

    const attempt: AuditAttempt = {
      bankCode,
      bankName: '',
      attempt: attemptNumber,
      timestamp: new Date(),
      success: false,
      duration: 0,
    };

    try {
      // Get bank details first
      const bank = await this.auditService.getBankByCode(bankCode);
      attempt.bankName = bank.name;

      console.log(`📍 Bank: ${bank.name}`);
      console.log(`🌐 URL: ${bank.loginUrl}`);
      console.log(`⏰ Started: ${new Date().toLocaleTimeString()}\n`);

      // Run the audit
      const result = await this.auditService.auditBank(bankCode, true);

      attempt.success = true;
      attempt.result = result;
      attempt.duration = Date.now() - startTime;

      console.log(`\n✅ SUCCESS: ${bank.name}`);
      console.log(`⏱️  Duration: ${(attempt.duration / 1000).toFixed(2)}s`);
      console.log(`📊 Risk Score: ${result.riskScore}/100`);
      console.log(`🔐 SSL Grade: ${result.ssl.grade}`);
      console.log(`🛡️  Headers Grade: ${result.headers.grade}`);
      console.log(`🔑 Auth Grade: ${result.authentication.grade}`);
      console.log(`🛑 CSRF Grade: ${result.csrf.grade}`);

      if (result.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        result.recommendations.forEach((rec, idx) => {
          console.log(`   ${idx + 1}. ${rec}`);
        });
      }

    } catch (error) {
      attempt.success = false;
      attempt.error = error.message;
      attempt.errorStack = error.stack;
      attempt.duration = Date.now() - startTime;

      console.log(`\n❌ FAILED: ${bankCode}`);
      console.log(`⏱️  Duration: ${(attempt.duration / 1000).toFixed(2)}s`);
      console.log(`🚨 Error: ${error.message}`);

      // Log error details
      this.logError(attempt);
    }

    this.attempts.push(attempt);
    return attempt;
  }

  /**
   * Log error details to file
   */
  private logError(attempt: AuditAttempt): void {
    const errorLogPath = path.join(this.screenshotsDir, 'errors.log');
    const errorEntry = `
${'='.repeat(80)}
Bank: ${attempt.bankCode} - ${attempt.bankName}
Attempt: ${attempt.attempt}
Timestamp: ${attempt.timestamp.toISOString()}
Duration: ${(attempt.duration / 1000).toFixed(2)}s
Error: ${attempt.error}

Stack Trace:
${attempt.errorStack}
${'='.repeat(80)}

`;

    fs.appendFileSync(errorLogPath, errorEntry);
    console.log(`📝 Error logged to: ${errorLogPath}`);
  }

  /**
   * Analyze error patterns across all attempts
   */
  analyzeErrorPatterns(): ErrorPattern[] {
    const errorMap = new Map<string, ErrorPattern>();

    this.attempts
      .filter((a) => !a.success)
      .forEach((attempt) => {
        const errorType = this.categorizeError(attempt.error || '');

        if (!errorMap.has(errorType)) {
          errorMap.set(errorType, {
            errorType,
            count: 0,
            affectedBanks: [],
            sampleMessage: attempt.error || '',
          });
        }

        const pattern = errorMap.get(errorType)!;
        pattern.count++;
        if (!pattern.affectedBanks.includes(attempt.bankCode)) {
          pattern.affectedBanks.push(attempt.bankCode);
        }
      });

    return Array.from(errorMap.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Categorize error type
   */
  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return 'TIMEOUT';
    }
    if (errorMessage.includes('navigation') || errorMessage.includes('Navigation')) {
      return 'NAVIGATION_FAILED';
    }
    if (errorMessage.includes('net::ERR')) {
      return 'NETWORK_ERROR';
    }
    if (errorMessage.includes('Cannot find')) {
      return 'ELEMENT_NOT_FOUND';
    }
    if (errorMessage.includes('MONGODB_URI') || errorMessage.includes('database')) {
      return 'DATABASE_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): string {
    const totalAudits = this.attempts.length;
    const successful = this.attempts.filter((a) => a.success).length;
    const failed = totalAudits - successful;
    const successRate = totalAudits > 0 ? ((successful / totalAudits) * 100).toFixed(1) : '0';

    const report = `
${'='.repeat(80)}
🐾✨ CHILEAN BANKS SECURITY AUDIT REPORT ✨🐾
${'='.repeat(80)}

Generated: ${new Date().toLocaleString()}
Microservice: chilean-banks-audit v1.0.0

## 📊 Summary

Total Audits: ${totalAudits}
✅ Successful: ${successful}
❌ Failed: ${failed}
📈 Success Rate: ${successRate}%

## 🏦 Bank Results

${this.attempts
  .map((attempt) => {
    if (attempt.success) {
      const result = attempt.result;
      return `
✅ ${attempt.bankName} (${attempt.bankCode})
   Duration: ${(attempt.duration / 1000).toFixed(2)}s
   Risk Score: ${result.riskScore}/100
   SSL: ${result.ssl.grade} | Headers: ${result.headers.grade} | Auth: ${result.authentication.grade} | CSRF: ${result.csrf.grade}
   Recommendations: ${result.recommendations.length}
`;
    } else {
      return `
❌ ${attempt.bankName || attempt.bankCode}
   Duration: ${(attempt.duration / 1000).toFixed(2)}s
   Error: ${attempt.error}
`;
    }
  })
  .join('\n')}

## 🔍 Error Analysis

${
  failed > 0
    ? this.analyzeErrorPatterns()
        .map(
          (pattern) => `
Error Type: ${pattern.errorType}
Count: ${pattern.count}
Affected Banks: ${pattern.affectedBanks.join(', ')}
Sample Message: ${pattern.sampleMessage}
`,
        )
        .join('\n')
    : 'No errors encountered! ✅'
}

## 💡 Recommendations for Improvement

${this.generateImprovementRecommendations()}

${'='.repeat(80)}

🐾✨ Generated by Neko-Arc System - Ethical Security Research
📦 NPM: npm install chilean-banks-audit
🔗 GitHub: https://github.com/JavierCollipal/chilean-banks-audit-microservice

ETHICAL USE ONLY: Educational cybersecurity research
NO credential testing | NO unauthorized access | Defensive analysis ONLY

${'='.repeat(80)}
`;

    return report;
  }

  /**
   * Generate improvement recommendations based on errors
   */
  private generateImprovementRecommendations(): string {
    const patterns = this.analyzeErrorPatterns();
    const recommendations: string[] = [];

    patterns.forEach((pattern) => {
      switch (pattern.errorType) {
        case 'TIMEOUT':
          recommendations.push(
            `⏰ Increase timeout values for slower-loading pages (current: 30s)`,
          );
          recommendations.push(
            `🔄 Implement retry logic with exponential backoff`,
          );
          break;
        case 'NAVIGATION_FAILED':
          recommendations.push(
            `🌐 Add URL validation and reachability checks before audit`,
          );
          recommendations.push(
            `🔄 Implement fallback URLs for banks with multiple portals`,
          );
          break;
        case 'NETWORK_ERROR':
          recommendations.push(
            `📡 Add network connectivity checks before starting audit`,
          );
          recommendations.push(
            `🔄 Implement request retry mechanism`,
          );
          break;
        case 'ELEMENT_NOT_FOUND':
          recommendations.push(
            `🔍 Make element selectors more flexible (multiple fallback selectors)`,
          );
          recommendations.push(
            `📸 Capture screenshots when elements not found for debugging`,
          );
          break;
        case 'DATABASE_ERROR':
          recommendations.push(
            `🗄️  Ensure MongoDB Atlas URI is configured in .env file`,
          );
          recommendations.push(
            `✅ Validate database connection before running audits`,
          );
          break;
      }
    });

    if (recommendations.length === 0) {
      return '✅ All audits successful! No improvements needed at this time.';
    }

    return recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n');
  }

  /**
   * Save report to file
   */
  saveReport(report: string): string {
    const reportPath = path.join(
      this.screenshotsDir,
      `audit-report-${new Date().toISOString().split('T')[0]}.txt`,
    );
    fs.writeFileSync(reportPath, report);
    return reportPath;
  }
}

/**
 * Main execution function
 */
async function runFullAudit() {
  console.log(`
${'='.repeat(80)}
🐾✨ CHILEAN BANKS SECURITY AUDIT - LIVE DEMONSTRATION ✨🐾
${'='.repeat(80)}

Microservice: chilean-banks-audit v1.0.0
ETHICAL USE: Educational defensive analysis only
NO credential testing | NO unauthorized access

Starting comprehensive audit of all Chilean banks...
${'='.repeat(80)}
`);

  // Bootstrap NestJS application
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const auditService = app.get(BankAuditService);
  const runner = new AuditRunner(auditService);

  // Get all banks
  const banks = await auditService.getAllBanks();

  if (banks.length === 0) {
    console.log('⚠️  No banks found in database!');
    console.log('📝 Run: npm run seed:banks');
    await app.close();
    return;
  }

  console.log(`\n📊 Found ${banks.length} banks to audit\n`);

  // Audit each bank
  for (const bank of banks) {
    await runner.auditBank(bank.code);

    // Small delay between audits to be respectful
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Generate and display report
  console.log('\n\n');
  const report = runner.generateReport();
  console.log(report);

  // Save report
  const reportPath = runner.saveReport(report);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  await app.close();
}

// Run the audit
runFullAudit().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
