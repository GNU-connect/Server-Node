import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('college')
export class CollegeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'college_ko' })
  name: string;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;
}
