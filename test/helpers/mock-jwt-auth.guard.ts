import { CanActivate, ExecutionContext } from '@nestjs/common';

export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { userId: 1 };
    return true;
  }
}