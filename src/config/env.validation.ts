import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  validateSync,
  IsUrl,
  Matches,
} from 'class-validator';

/**
 * Environment Variables Validation Schema
 *
 * This class defines all required and optional environment variables
 * with proper validation rules. Validation occurs at application startup.
 *
 * RULE 11: Credential Security - Never hardcode credentials
 * RULE 47: MongoDB Atlas Only - No localhost connections (except test env)
 */
export class EnvironmentVariables {
  /**
   * MongoDB Atlas URI (REQUIRED)
   * Must use mongodb+srv:// protocol
   * Exception: mongodb://localhost allowed only in test environment
   */
  @IsString()
  @IsNotEmpty({ message: 'MONGODB_URI is required. Please set it in .env file.' })
  @Matches(/^mongodb(\+srv)?:\/\/.+/, {
    message: 'MONGODB_URI must be a valid MongoDB connection string',
  })
  MONGODB_URI: string;

  /**
   * Puppeteer Headless Mode (OPTIONAL)
   * Default: false (for educational visual mode - RULE 10)
   * Production: true (recommended)
   */
  @IsString()
  @IsOptional()
  PUPPETEER_HEADLESS: string = 'false';

  /**
   * Puppeteer Slow Motion (OPTIONAL)
   * Adds delay between actions in milliseconds
   * Default: 250ms (for educational visibility)
   * Production: 0 (no delay)
   */
  @IsString()
  @IsOptional()
  PUPPETEER_SLOW_MO: string = '250';

  /**
   * Puppeteer DevTools (OPTIONAL)
   * Opens DevTools automatically
   * Default: true (for educational purposes)
   * Production: false
   */
  @IsString()
  @IsOptional()
  PUPPETEER_DEVTOOLS: string = 'true';

  /**
   * Application Port (OPTIONAL)
   * Default: 3000
   */
  @IsString()
  @IsOptional()
  PORT: string = '3000';

  /**
   * Node Environment (OPTIONAL)
   * Values: development, production, test
   * Default: development
   */
  @IsString()
  @IsOptional()
  NODE_ENV: string = 'development';
}

/**
 * Validates environment variables at application startup
 *
 * @param config - Raw environment variables from process.env
 * @returns Validated and transformed configuration object
 * @throws Error if validation fails with detailed error messages
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    // Format error messages
    const errorMessages = errors.map(error => {
      const constraints = Object.values(error.constraints || {});
      return `  ❌ ${error.property}: ${constraints.join(', ')}`;
    });

    throw new Error(
      `\n🚨 Environment Variable Validation Failed:\n\n${errorMessages.join('\n')}\n\n` +
        `📝 Please check your .env file and ensure all required variables are set.\n` +
        `📚 See DEPLOYMENT.md for configuration examples.\n`
    );
  }

  // Additional RULE 47 validation (MongoDB Atlas only)
  validateMongoDBURI(validatedConfig.MONGODB_URI, validatedConfig.NODE_ENV);

  return validatedConfig;
}

/**
 * RULE 47 Validator: MongoDB Atlas Only
 *
 * Ensures MongoDB connection uses Atlas URI (mongodb+srv://)
 * Exception: localhost allowed in test environment only
 *
 * @param mongoUri - MongoDB connection string
 * @param nodeEnv - Node environment (test, development, production)
 * @throws Error if localhost is used outside test environment
 */
function validateMongoDBURI(mongoUri: string, nodeEnv: string): void {
  const isTestEnvironment = nodeEnv === 'test';
  const isLocalhost = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
  const isAtlas = mongoUri.startsWith('mongodb+srv://');

  // Test environment exception
  if (isTestEnvironment && isLocalhost) {
    console.log(
      '⚠️  Test environment detected: Allowing localhost MongoDB (MongoDB Memory Server)'
    );
    return;
  }

  // Production/Development must use Atlas
  if (isLocalhost && !isTestEnvironment) {
    throw new Error(
      `\n🚨 RULE 47 Violation: MongoDB Atlas Required\n\n` +
        `  ❌ Localhost MongoDB connections are NOT allowed in production/development\n` +
        `  ✅ Use MongoDB Atlas: mongodb+srv://user:password@cluster.mongodb.net/database\n\n` +
        `📝 Current MONGODB_URI: ${mongoUri.replace(/\/\/[^@]+@/, '//***:***@')}\n` +
        `📚 See DEPLOYMENT.md for MongoDB Atlas setup instructions.\n`
    );
  }

  // Warn if not using Atlas in production
  if (!isAtlas && nodeEnv === 'production') {
    console.warn(
      `⚠️  Warning: Production environment should use MongoDB Atlas (mongodb+srv://)\n` +
        `   Current protocol: ${mongoUri.split('://')[0]}://\n`
    );
  }
}

/**
 * Helper function to get typed configuration values
 *
 * Example usage:
 *   const mongoUri = getConfig('MONGODB_URI');
 *   const port = getConfigAsNumber('PORT', 3000);
 *   const isHeadless = getConfigAsBoolean('PUPPETEER_HEADLESS', false);
 */
export function getConfig(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}

export function getConfigAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export function getConfigAsBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
