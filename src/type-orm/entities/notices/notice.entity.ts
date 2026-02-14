import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NoticeCategory } from './notice-category.entity';

@Entity('notice')
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'ntt_sn' })
  nttSn: number;

  @Column({ name: 'created_at', type: 'date' })
  createdAt: Date;

  @ManyToOne(() => NoticeCategory, (category) => category.notices)
  @JoinColumn({ name: 'category_id' })
  category: NoticeCategory;
}
