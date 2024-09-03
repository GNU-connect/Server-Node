import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('campus')
export class CampusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campus_name_ko' })
  name: string;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;
}
