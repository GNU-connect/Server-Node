import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CollegeEntity } from './college.entity';

@Entity('department')
export class DepartmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CollegeEntity, (college) => college.id)
  @JoinColumn({ name: 'college_id' })
  college: CollegeEntity;

  @Column({ name: 'department_ko' })
  name: string;
}
