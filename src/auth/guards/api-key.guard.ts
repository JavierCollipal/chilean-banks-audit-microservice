import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { apiKeyConfig } from '../../config/jwt.config';

/**
 * Optional API Key Guard
 *
 * Sprint 3.6: JWT Infrastructure
 *
 * Validates API keys from X-API-Key header
 * Like JWT guard, this is optional and allows anonymous access
 *
 * Priority:
 * 1. Check for API key in X-API-Key header
 * 2. If valid, attach API key info to request
 * 3. If invalid or missing, allow request anyway (educational mode)
 */
@Injectable()
export class OptionalApiKeyGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = request.headers[apiKeyConfig.headerName.toLowerCase()];

    if (apiKey) {
      // Validate API key
      const keyPayload = await this.authService.validateApiKey(apiKey);

      if (keyPayload) {
        // Attach API key info to request
        request.apiKey = keyPayload;
        request.user = {
          userId: 'api-key-user',
          username: keyPayload.name || 'API Key User',
          role: 'api',
          authMethod: 'api-key',
        };
      }
    }

    // Always return true (optional authentication)
    return true;
  }
}
