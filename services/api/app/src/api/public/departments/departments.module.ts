import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentMessagesService } from 'src/api/public/message-templates/department-messages.service';
import { Department } from 'src/type-orm/entities/departments/department.entity';
import { DepartmentsRepository } from 'src/type-orm/entities/departments/departments.repository';
import { DepartmentsService } from './departments.service';
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
