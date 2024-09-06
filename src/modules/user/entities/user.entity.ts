import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('kakao-user')
export class UserEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column({ name: 'user_type' })
  userType: number;
}
