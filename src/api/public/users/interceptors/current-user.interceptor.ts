import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FETCH_CURRENT_USER_KEY } from 'src/api/public/users/decorators/fetch-current-user.decorator';
import { UsersService } from 'src/api/public/users/users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const shouldFetch = this.reflector.getAllAndOverride<boolean>(
      FETCH_CURRENT_USER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (shouldFetch) {
      const req = context.switchToHttp().getRequest();
      const userId =
        req.headers['x-user-id'] || req.body?.userRequest?.user?.id;
      

      if (userId) {
        try {
          req.currentUser = (await this.usersService.findOne(userId)) || {
            id: userId,
            campus: null,
            department: null,
          };
        } catch {
          req.currentUser = {
            id: userId,
            campus: null,
            department: null,
          };
        }
      }
    }

    return next.handle();
  }
}
