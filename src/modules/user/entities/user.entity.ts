import { CampusEntity } from 'src/modules/common/entities/campus.entity';
import { DepartmentEntity } from 'src/modules/common/entities/department.entity';
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('kakao-user')
export class UserEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @ManyToOne(() => CampusEntity, (campus) => campus.id)
  @JoinColumn({ name: 'campus_id' })
  campus: CampusEntity;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => DepartmentEntity, (department) => department.id)
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity;

  @Column({ name: 'user_type' })
  userType: number;
}
