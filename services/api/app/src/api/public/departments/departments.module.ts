import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from 'src/api/public/departments/domain/entities/department.entity';
import { DepartmentsRepository } from 'src/api/public/departments/infrastructure/departments.repository';
import { DepartmentsService } from 'src/api/public/departments/application/departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  providers: [DepartmentsService, DepartmentsRepository],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
