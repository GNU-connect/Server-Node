import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { College } from '../../colleges/entities/college.entity';

@Entity('department')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_ko' })
  name: string;

  @ManyToOne(() => College, (college) => college.id, { eager: true })
  @JoinColumn({ name: 'college_id' })
  college: College;
}
