import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AdminAuthService,
  AuthenticatedAdmin,
} from 'src/api/admin/auth/application/admin-auth.service';
import {
  ADMIN_SESSION_COOKIE,
  sessionCookieOptions,
} from 'src/api/admin/auth/presentation/admin-session.cookie';

export type AdminRequest = Request & { adminUser?: AuthenticatedAdmin };

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AdminRequest>();

    const token: unknown = request.cookies?.[ADMIN_SESSION_COOKIE];
    if (typeof token !== 'string' || token === '') throw new UnauthorizedException();

    const session = await this.adminAuthService.validateSession(token);
    if (!session) throw new UnauthorizedException();

    request.adminUser = session.adminUser;
    if (session.renewedUntil) {
      http.getResponse<Response>().cookie(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    }
    return true;
  }
}
