import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { College } from '../colleges/college.entity';
import { User } from '../users/users.entity';

@Entity('department')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_ko' })
  name: string;

  @OneToMany(() => User, (users) => users.department)
  users: User[];

  @ManyToOne(() => College, (college) => college.departments)
  @JoinColumn({ name: 'college_id' })
  college: College;
}
