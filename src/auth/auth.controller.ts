import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

/**
 * Authentication Controller
 *
 * Sprint 3.6: JWT Infrastructure (Optional Authentication)
 *
 * Provides endpoints for generating JWT tokens and API keys
 * All endpoints are public (no authentication required)
 *
 * IMPORTANT: This is for EDUCATIONAL purposes only
 * - Real production systems should have proper user registration/login
 * - Demo tokens are provided for easy testing
 * - Never use these demo credentials in production
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Generate demo JWT token
   *
   * Creates a demo token valid for 24 hours
   * FOR EDUCATIONAL TESTING ONLY
   */
  @Post('demo-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate demo JWT token (EDUCATIONAL USE ONLY)',
    description:
      'Creates a demo JWT token for testing authentication. ' +
      'Valid for 24 hours. Use in Authorization header as: Bearer <token>',
  })
  @ApiResponse({
    status: 200,
    description: 'Demo token generated successfully',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: '24h',
        user: {
          sub: 'demo-user-123',
          username: 'demo',
          email: 'demo@educational.example',
          role: 'student',
        },
        usage: {
          header: 'Authorization: Bearer <token>',
          example: 'curl -H "Authorization: Bearer <token>" http://localhost:3000/audit/banks',
        },
      },
    },
  })
  async generateDemoToken() {
    const result = await this.authService.generateDemoToken();

    return {
      ...result,
      usage: {
        header: 'Authorization: Bearer <token>',
        example: `curl -H "Authorization: Bearer ${result.token.substring(0, 20)}..." http://localhost:3000/audit/banks`,
      },
    };
  }

  /**
   * Generate demo API key
   *
   * Creates a demo API key for testing
   * FOR EDUCATIONAL TESTING ONLY
   */
  @Post('demo-api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate demo API key (EDUCATIONAL USE ONLY)',
    description:
      'Creates a demo API key for testing. ' +
      'Use in X-API-Key header. Note: This key is not persisted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Demo API key generated',
    schema: {
      example: {
        apiKey: 'cbam_demo_abc123',
        headerName: 'X-API-Key',
        usage: {
          header: 'X-API-Key: cbam_demo_abc123',
          example: 'curl -H "X-API-Key: cbam_demo_abc123" http://localhost:3000/audit/banks',
        },
        note: 'This is a temporary key for demonstration. Use environment variable API_KEYS for persistent keys.',
      },
    },
  })
  async generateDemoApiKey() {
    const apiKey = this.authService.generateDemoApiKey();

    return {
      apiKey,
      headerName: 'X-API-Key',
      usage: {
        header: `X-API-Key: ${apiKey}`,
        example: `curl -H "X-API-Key: ${apiKey}" http://localhost:3000/audit/banks`,
      },
      note: 'This is a temporary key for demonstration. Use environment variable API_KEYS for persistent keys.',
    };
  }

  /**
   * Get authentication information
   *
   * Returns information about authentication configuration
   */
  @Get('info')
  @ApiOperation({
    summary: 'Get authentication configuration information',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication configuration',
  })
  async getAuthInfo() {
    return this.authService.getAuthInfo();
  }

  /**
   * Verify JWT token
   *
   * Validates a JWT token and returns decoded payload
   */
  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify and decode JWT token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'JWT token to verify',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['token'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      example: {
        valid: true,
        payload: {
          sub: 'demo-user-123',
          username: 'demo',
          email: 'demo@educational.example',
          role: 'student',
          iat: 1234567890,
          exp: 1234654290,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token is invalid',
    schema: {
      example: {
        valid: false,
        error: 'Token expired or invalid',
      },
    },
  })
  async verifyToken(@Body('token') token: string) {
    const payload = await this.authService.verifyToken(token);

    if (payload) {
      return {
        valid: true,
        payload,
      };
    }

    return {
      valid: false,
      error: 'Token expired or invalid',
    };
  }
}
