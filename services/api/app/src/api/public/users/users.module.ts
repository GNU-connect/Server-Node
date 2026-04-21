import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CollegesModule } from 'src/api/public/colleges/colleges.module';
import { DepartmentsModule } from 'src/api/public/departments/departments.module';
import { AuthGuard } from 'src/api/public/users/guards/auth.guard';
import { CurrentUserInterceptor } from 'src/api/public/users/interceptors/current-user.interceptor';
import { DatabaseModule } from '../../../type-orm/database.module';
import { User } from '../../../type-orm/entities/users/users.entity';
import { UsersRepository } from '../../../type-orm/entities/users/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserMessageService } from 'src/api/public/users/user-messages.service';
import { CommonMessagesService } from 'src/api/public/common/common-messages.service';
import { CampusMessagesService } from 'src/api/public/campuses/campus-messages.service';
import { CollegeMessagesService } from 'src/api/public/colleges/college-messages.service';
import { DepartmentMessagesService } from 'src/api/public/departments/department-messages.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    CampusesModule,
    CollegesModule,
    DepartmentsModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrentUserInterceptor,
    },
    UserMessageService,
    CommonMessagesService,
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
  ],
})
export class UsersModule {}
