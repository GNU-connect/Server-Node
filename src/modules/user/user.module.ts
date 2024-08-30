import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentRepository } from './repository/department.repository';
import { CampusEntity } from './entities/campus.entity';
import { CampusRepository } from './repository/campus.repository';
import { CollegeRepository } from './repository/college.repository';
import { CollegeEntity } from './entities/college.entity';
import { DepartmentEntity } from './entities/department.entity';
import { UserRepository } from './repository/user.repository';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    SupabaseModule,
    TypeOrmModule.forFeature([
      CampusEntity,
      CollegeEntity,
      DepartmentEntity,
      UserEntity,
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    DepartmentRepository,
    CampusRepository,
    CollegeRepository,
    DepartmentRepository,
    UserRepository,
  ],
})
export class UserModule {}
