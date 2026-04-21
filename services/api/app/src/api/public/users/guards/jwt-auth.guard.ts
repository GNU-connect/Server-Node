import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(): boolean {
    // JWT 도입 전 임시 passthrough
    return true;
  }
}
