import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.headers['x-user-id'] || request.body.userRequest.user?.id;
    const user = await this.usersService.findOneByUserId(userId);
    if (user) {
      request.currentUser = user;
    } else {
      request.currentUser = {
        id: userId,
      };
    }
    return next.handle();
  }
}
