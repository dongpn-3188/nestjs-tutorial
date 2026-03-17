import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
       if (err) {
         throw err || new UnauthorizedException();
       }
       // Use "info" to surface more specific authentication failure reasons when available
       if (info instanceof Error && info.message) {
         throw new UnauthorizedException(info.message);
       }
       if (typeof info === 'string' && info) {
         throw new UnauthorizedException(info);
       }
       throw new UnauthorizedException();
    }
    return user;
  }
}