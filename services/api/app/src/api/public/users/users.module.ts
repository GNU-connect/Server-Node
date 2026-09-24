import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CollegesModule } from 'src/api/public/colleges/colleges.module';
import { DepartmentsModule } from 'src/api/public/departments/departments.module';
import { CurrentUserInterceptor } from 'src/api/public/users/presentation/interceptors/current-user.interceptor';
import { User } from 'src/api/public/users/domain/entities/users.entity';
import { UsersRepository } from 'src/api/public/users/infrastructure/users.repository';
import { UsersKakaoController } from 'src/api/public/users/presentation/users-kakao.controller';
import { UsersService } from 'src/api/public/users/application/users.service';
import { UserMessageFactory } from 'src/api/public/users/presentation/user-message.factory';
import { CommonMessageFactory } from 'src/api/public/common/presentation/common-message.factory';
import { CampusMessageFactory } from 'src/api/public/campuses/presentation/campus-message.factory';
import { CollegeMessageFactory } from 'src/api/public/colleges/presentation/college-message.factory';
import { DepartmentMessageFactory } from 'src/api/public/departments/presentation/department-message.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CampusesModule, CollegesModule, DepartmentsModule],
  controllers: [UsersKakaoController],
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
