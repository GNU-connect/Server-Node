import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // health check 엔드포인트는 인증 제외
    if (path === '/api/node/health') {
      return true;
    }

    const userId =
      request.headers['x-user-id'] || request.body.userRequest.user?.id;
    if (userId) {
      request['userId'] = userId;
    }

    return !!userId;
  }
}
