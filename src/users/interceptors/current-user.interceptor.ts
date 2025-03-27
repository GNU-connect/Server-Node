import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.headers['x-user-id'] || request.body.userRequest.user?.id;
    if (userId) {
      const user = await this.usersService.findOneByUserId(userId);
      request.currentUser = user;
    }
    return next.handle();
  }
}
