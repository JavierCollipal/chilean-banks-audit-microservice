import { CacheModuleOptions } from '@nestjs/cache-manager';
import { getConfigAsNumber } from './env.validation';

/**
 * Cache Configuration for Performance Optimization
 *
 * Caching Strategy:
 * - Bank data: 1 hour (infrequent changes)
 * - Audit results: 5 minutes (security data changes frequently)
 * - Service info: 1 hour (static information)
 *
 * Benefits:
 * - Reduces MongoDB queries
 * - Improves response times
 * - Reduces load on external services (Puppeteer)
 */
export const cacheConfig: CacheModuleOptions = {
  // Time to live (TTL) in milliseconds
  ttl: getConfigAsNumber('CACHE_TTL', 300000), // Default: 5 minutes

  // Maximum number of items in cache
  max: getConfigAsNumber('CACHE_MAX_ITEMS', 100),

  // Global cache options
  isGlobal: true,
};

/**
 * Cache TTL Constants (in milliseconds)
 */
export const CacheTTL = {
  /** Bank data cache: 1 hour */
  BANK_DATA: 3600000,

  /** Single bank cache: 1 hour */
  SINGLE_BANK: 3600000,

  /** Audit result cache: 5 minutes */
  AUDIT_RESULT: 300000,

  /** Audit history cache: 2 minutes */
  AUDIT_HISTORY: 120000,

  /** Service info cache: 1 hour */
  SERVICE_INFO: 3600000,

  /** Health check cache: 30 seconds */
  HEALTH_CHECK: 30000,
} as const;

/**
 * Cache Keys for consistent key generation
 */
export const CacheKeys = {
  ALL_BANKS: 'banks:all',
  BANK_BY_CODE: (code: string) => `bank:${code}`,
  AUDIT_RESULT: (bankCode: string) => `audit:result:${bankCode}`,
  AUDIT_HISTORY: (bankCode: string, limit: number) => `audit:history:${bankCode}:${limit}`,
  SERVICE_INFO: 'service:info',
  HEALTH: 'health:status',
} as const;

/**
 * Helper function to invalidate cache for a specific bank
 * Used when bank data is updated or deleted
 */
export function getInvalidationKeys(bankCode: string): string[] {
  return [
    CacheKeys.ALL_BANKS,
    CacheKeys.BANK_BY_CODE(bankCode),
    CacheKeys.AUDIT_RESULT(bankCode),
    // Invalidate all possible audit history variations
    ...Array.from({ length: 10 }, (_, i) => CacheKeys.AUDIT_HISTORY(bankCode, (i + 1) * 5)),
  ];
}
