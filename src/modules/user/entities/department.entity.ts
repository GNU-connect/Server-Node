import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('department')
export class DepartmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_ko' })
  name: string;
}
