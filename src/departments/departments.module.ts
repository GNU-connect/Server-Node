import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from 'src/departments/entities/department.entity';
import { DepartmentsRepository } from 'src/departments/repositories/departments.repository';
import { DepartmentMessagesService } from 'src/message-templates/department-messages.service';
@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  providers: [
    DepartmentsService,
    DepartmentsRepository,
    DepartmentMessagesService,
  ],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
