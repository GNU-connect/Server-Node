import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Campus } from 'src/api/public/campuses/domain/entities/campus.entity';
import { Department } from 'src/api/public/departments/domain/entities/department.entity';

@Entity('kakao-user')
export class User {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Campus, campus => campus.users)
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @ManyToOne(() => Department, department => department.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
