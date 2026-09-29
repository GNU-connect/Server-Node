import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
