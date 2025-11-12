import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Performance Monitoring Controller
 *
 * Provides performance metrics for monitoring and optimization:
 * - Cache statistics
 * - System health metrics
 * - Memory usage
 * - Response time statistics
 *
 * Sprint 3.5: Performance Optimization
 */
@ApiTags('performance')
@Controller('performance')
export class PerformanceController {
  private requestCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private startTime = Date.now();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get performance metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics and statistics' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getMetrics() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();

    return {
      service: {
        name: 'Chilean Banks Audit Microservice',
        version: '1.5.0',
        uptime: {
          milliseconds: uptime,
          seconds: Math.floor(uptime / 1000),
          formatted: this.formatUptime(uptime),
        },
        startedAt: new Date(this.startTime).toISOString(),
      },
      cache: {
        enabled: true,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate:
          this.cacheHits + this.cacheMisses > 0
            ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(2) + '%'
            : '0%',
        totalRequests: this.cacheHits + this.cacheMisses,
      },
      memory: {
        rss: this.formatBytes(memoryUsage.rss),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        external: this.formatBytes(memoryUsage.external),
        usagePercentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%',
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpuUsage: process.cpuUsage(),
        pid: process.pid,
      },
      rateLimiting: {
        enabled: true,
        global: '10 requests per minute',
        audit: '3 requests per minute',
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
      },
    };
  }

  /**
   * Get cache statistics
   */
  @Get('cache-stats')
  @ApiOperation({ summary: 'Get detailed cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved' })
  async getCacheStats() {
    return {
      cacheEnabled: true,
      statistics: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        total: this.cacheHits + this.cacheMisses,
        hitRate:
          this.cacheHits + this.cacheMisses > 0
            ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(2) + '%'
            : '0%',
      },
      configuration: {
        defaultTTL: '5 minutes (300000ms)',
        maxItems: 100,
        ttlByType: {
          bankData: '1 hour (3600000ms)',
          auditResults: '5 minutes (300000ms)',
          auditHistory: '2 minutes (120000ms)',
          serviceInfo: '1 hour (3600000ms)',
        },
      },
    };
  }

  /**
   * Clear all cache
   * WARNING: This will reset all cached data
   * Note: Manual cache clearing by key (cache.reset() not available in this version)
   */
  @Get('cache-clear')
  @ApiOperation({
    summary: 'Get cache clear instructions (Manual clearing required)',
  })
  @ApiResponse({ status: 200, description: 'Cache clear instructions provided' })
  async clearCache() {
    return {
      status: 'info',
      message: 'Manual cache clearing is available via application restart or individual key deletion',
      methods: {
        restart: 'Restart the application to clear all cache',
        individualKeys: 'Delete individual cache keys via cacheManager.del(key)',
        ttl: 'Cache automatically expires based on TTL (5min-1h)',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Increment cache hit counter (called internally)
   */
  incrementCacheHit() {
    this.cacheHits++;
  }

  /**
   * Increment cache miss counter (called internally)
   */
  incrementCacheMiss() {
    this.cacheMisses++;
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human-readable format
   */
  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ') || '0s';
  }
}
