import { College } from 'src/type-orm/entities/colleges/college.entity';

export interface CollegeListResult {
  colleges: College[];
  total: number;
}
