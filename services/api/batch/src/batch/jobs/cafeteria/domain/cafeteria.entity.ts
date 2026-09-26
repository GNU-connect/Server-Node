import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cafeteria')
export class Cafeteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'cafeteria_name_ko' })
  name: string;

  @Column()
  mi: number;

  @Column({ name: 'rest_seq' })
  restSeq: number;

  @Column()
  type: string;

  @Column({ name: 'sch_sys_id', type: 'varchar', nullable: true })
  schSysId: string | null;

  @Column({ name: 'form_type', type: 'smallint', nullable: true })
  formType: number | null;

  @Column({ name: 'last_date', type: 'date', nullable: true })
  lastDate: string | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;
}
