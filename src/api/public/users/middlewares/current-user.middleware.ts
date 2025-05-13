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
    const userId = req.headers['x-user-id'] || req.body?.userRequest?.user?.id;

    if (!userId) {
      return next();
    }

    try {
      const user = await this.usersService.findOne(userId);
      req.currentUser = user || {
        id: userId,
        campus: null,
        department: null,
      };
    } catch (error) {
      req.currentUser = {
        id: userId,
        campus: null,
        department: null,
      };
    }

    next();
  }
}
