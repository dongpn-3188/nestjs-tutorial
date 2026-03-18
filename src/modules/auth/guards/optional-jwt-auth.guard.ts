import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, _info, context) {
    const request = context?.switchToHttp?.().getRequest?.();
    const hasAuthorizationHeader = !!request?.headers?.authorization;
    // Keep endpoint public when no token is provided: attach user when token is valid,
    // otherwise continue as anonymous only if there was no Authorization header.
    if (!user || err) {
      if (hasAuthorizationHeader) {
        // A token was provided but is invalid/expired or caused another auth error.
        throw err || new UnauthorizedException();
      }
      // No Authorization header: proceed as anonymous.
      return null;
    }
    return user;
  }
}
