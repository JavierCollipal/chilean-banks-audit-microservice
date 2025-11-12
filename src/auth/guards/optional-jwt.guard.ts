import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Optional JWT Guard
 *
 * Sprint 3.6: JWT Infrastructure
 *
 * This guard allows requests to proceed whether or not they have valid authentication.
 * If a valid JWT token is provided, user information is attached to the request.
 * If no token or invalid token, request still proceeds (for educational purposes).
 *
 * Usage:
 * @UseGuards(OptionalJwtGuard)
 * async someEndpoint(@Req() req) {
 *   if (req.user) {
 *     // Authenticated user
 *   } else {
 *     // Anonymous user
 *   }
 * }
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  /**
   * Override canActivate to make authentication optional
   *
   * Returns true even if authentication fails
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Always return true to allow requests through
    // JWT strategy will still run and attach user if token is valid
    return true;
  }

  /**
   * Override handleRequest to not throw errors
   *
   * Returns user if authentication succeeded, undefined otherwise
   */
  handleRequest(err: any, user: any, info: any) {
    // If there's a user, attach it
    if (user) {
      return user;
    }

    // No user? No problem! Return undefined and let request continue
    return undefined;
  }
}
