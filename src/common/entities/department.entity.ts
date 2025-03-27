import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { College } from './college.entity';

@Entity('department')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => College, (college) => college.id)
  @JoinColumn({ name: 'college_id' })
  college: College;

  @Column({ name: 'department_ko' })
  name: string;
}
