import { Campus } from 'src/common/entities/campus.entity';
import { Department } from 'src/common/entities/department.entity';
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('kakao-user')
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @ManyToOne(() => Campus, (campus) => campus.id)
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Department, (department) => department.id)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'user_type' })
  userType: number;
}
