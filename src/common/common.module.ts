import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from './entities/campus.entity';
import { College } from './entities/college.entity';
import { Department } from './entities/department.entity';
import { CampusesRepository } from './repositories/campuses.repository';
import { CollegesRepository } from './repositories/colleges.repository';
import { DepartmentsRepository } from './repositories/departments.repository';

@Module({
  imports: [
    SupabaseModule,
    TypeOrmModule.forFeature([Campus, College, Department]),
  ],
  providers: [
    CommonService,
    CampusesRepository,
    CollegesRepository,
    DepartmentsRepository,
  ],
  exports: [CommonService],
})
export class CommonModule {}
