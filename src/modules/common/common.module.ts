import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusEntity } from './entities/campus.entity';
import { CollegeEntity } from './entities/college.entity';
import { DepartmentEntity } from './entities/department.entity';
import { CampusRepository } from './repository/campus.repository';
import { CollegeRepository } from './repository/college.repository';
import { DepartmentRepository } from './repository/department.repository';

@Module({
  imports: [
    SupabaseModule,
    TypeOrmModule.forFeature([CampusEntity, CollegeEntity, DepartmentEntity]),
  ],
  providers: [
    CommonService,
    CampusRepository,
    CollegeRepository,
    DepartmentRepository,
  ],
  exports: [CommonService],
})
export class CommonModule {}
