import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/api/public/users/users.service';
import { User } from 'src/type-orm/entities/users/users.entity';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 헬스체크 경로인 경우 미들웨어 로직 건너뛰기
    if (req.baseUrl === '/api/node/health') {
      return next();
    }

    const userId = req.headers['x-user-id'] || req.body?.userRequest?.user?.id;
    const user = await this.usersService.findOne(userId);
    if (user) {
      req.currentUser = user;
    } else {
      req.currentUser = {
        id: userId,
        campus: null,
        department: null,
      };
    }

    next();
  }
}
