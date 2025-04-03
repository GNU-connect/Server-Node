import { Campus } from 'src/campuses/entities/campus.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('kakao-user')
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Campus, (campus) => campus.id, { eager: true })
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @ManyToOne(() => Department, (department) => department.id, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
