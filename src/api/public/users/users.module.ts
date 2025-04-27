import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CollegesModule } from 'src/api/public/colleges/colleges.module';
import { DepartmentsModule } from 'src/api/public/departments/departments.module';
import { MessagesModule } from 'src/api/public/message-templates/messages.module';
import { AuthGuard } from 'src/api/public/users/guards/auth.guard';
import { CurrentUserMiddleware } from 'src/api/public/users/middlewares/current-user.middleware';
import { DatabaseModule } from '../../../type-orm/database.module';
import { User } from '../../../type-orm/entities/users/users.entity';
import { UsersRepository } from '../../../type-orm/entities/users/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    CampusesModule,
    CollegesModule,
    DepartmentsModule,
    MessagesModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
  }
}
