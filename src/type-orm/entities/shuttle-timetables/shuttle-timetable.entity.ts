import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shuttle_timetable')
export class ShuttleTimetable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'route_name', length: 100, unique: true })
  routeName: string;

  @Column({ type: 'jsonb' })
  timetable: object;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
