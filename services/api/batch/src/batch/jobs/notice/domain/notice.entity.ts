import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  createdAt: string;
}
