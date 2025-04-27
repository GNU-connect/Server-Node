import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CollegesModule } from 'src/api/public/colleges/colleges.module';
import { DepartmentsModule } from 'src/api/public/departments/departments.module';
import { MessagesModule } from 'src/api/public/message-templates/messages.module';
import { AuthGuard } from 'src/api/public/users/guards/auth.guard';
import { DatabaseModule } from '../../../type-orm/database.module';
import { User } from '../../../type-orm/entities/users/users.entity';
import { UsersRepository } from '../../../type-orm/entities/users/users.repository';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
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
    CurrentUserInterceptor,
  ],
})
export class UsersModule {}
