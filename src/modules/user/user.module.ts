import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentRepository } from './repository/department.repository';
import { CampusEntity } from './entities/campus.entity';
import { CampusRepository } from './repository/campus.repository';
import { CollegeRepository } from './repository/college.entity';
import { CollegeEntity } from './entities/college.entity';

@Module({
  imports: [
    SupabaseModule,
    TypeOrmModule.forFeature([CampusEntity, CollegeEntity]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    DepartmentRepository,
    CampusRepository,
    CollegeRepository,
  ],
})
export class UserModule {}
