import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('news')
export class NewsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'registration_time' })
  registrationTime: string;

  @Column({ name: 'url' })
  url: string;
}
