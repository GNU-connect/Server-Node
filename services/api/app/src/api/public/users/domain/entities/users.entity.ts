import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Campus } from 'src/api/public/campuses/domain/entities/campus.entity';
import { Department } from 'src/api/public/departments/domain/entities/department.entity';

@Entity('kakao-user')
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Campus, campus => campus.users)
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @ManyToOne(() => Department, department => department.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  updateProfile(userId: string, campusId: number, departmentId: number) {
    this.id = userId;
    this.campusId = campusId;
    this.departmentId = departmentId;
  }
}
