import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class KakaoAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'] || request.body?.userRequest?.user?.id;
    if (userId) {
      request['userId'] = userId;
    }
    return !!userId;
  }
}
