import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

export const ADMIN_API_KEY_HEADER = 'x-admin-api-key';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('ADMIN_API_KEY');
    // 키가 설정되지 않은 환경에서는 admin API를 막는다
    if (!expected) return false;

    const request = context.switchToHttp().getRequest();
    const provided = request.headers[ADMIN_API_KEY_HEADER];
    if (typeof provided !== 'string') return false;

    return timingSafeEqual(digest(provided), digest(expected));
  }
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}
