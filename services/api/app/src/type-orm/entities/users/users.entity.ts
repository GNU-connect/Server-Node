import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Campus } from '../campuses/campus.entity';
import { Department } from '../departments/department.entity';

@Entity('kakao-user')
export class User {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Campus, (campus) => campus.users)
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
