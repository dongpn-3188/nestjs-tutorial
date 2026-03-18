import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err, user) {
    // Keep endpoint public: attach user when token is valid, otherwise continue as anonymous.
    return user || null;
  }
}
