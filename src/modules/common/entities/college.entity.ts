import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('college')
export class College {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'college_ko' })
  name: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;
}
