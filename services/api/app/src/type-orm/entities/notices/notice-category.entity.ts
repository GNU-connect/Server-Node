import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Department } from '../departments/department.entity';
import { Notice } from './notice.entity';

@Entity('notice_category')
export class NoticeCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column({ length: 50 })
  category: string;

  @Column()
  mi: number;

  @Column({ name: 'bbs_id' })
  bbsId: number;

  @Column({ name: 'last_ntt_sn', default: 0 })
  lastNttSn: number;

  @Column({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => Notice, (notice: Notice) => notice.category)
  notices: Notice[];
}
