import { Department } from 'src/type-orm/entities/departments/department.entity';

export interface DepartmentListResult {
  departments: Department[];
  total: number;
}
