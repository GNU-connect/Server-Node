import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CollegesModule } from 'src/api/public/colleges/colleges.module';
import { DepartmentsModule } from 'src/api/public/departments/departments.module';
import { CurrentUserInterceptor } from 'src/api/public/users/interceptors/current-user.interceptor';
import { User } from 'src/api/public/users/entities/users.entity';
import { UsersRepository } from 'src/api/public/users/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserMessageFactory } from 'src/api/public/users/user-message.factory';
import { CommonMessageFactory } from 'src/api/public/common/common-message.factory';
import { CampusMessageFactory } from 'src/api/public/campuses/campus-message.factory';
import { CollegeMessageFactory } from 'src/api/public/colleges/college-message.factory';
import { DepartmentMessageFactory } from 'src/api/public/departments/department-message.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CampusesModule, CollegesModule, DepartmentsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrentUserInterceptor,
    },
    UserMessageFactory,
    CommonMessageFactory,
    CampusMessageFactory,
    CollegeMessageFactory,
    DepartmentMessageFactory,
  ],
})
export class UsersModule {}
