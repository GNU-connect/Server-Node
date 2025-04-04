import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../common/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './repositories/users.repository';
import { User } from './entities/users.entity';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { CampusesModule } from 'src/campuses/campuses.module';
import { CollegesModule } from 'src/colleges/colleges.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { MessagesModule } from 'src/message-templates/messages.module';

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
