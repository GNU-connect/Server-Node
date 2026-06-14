import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ShuttleTimetableMap } from '../type/parsed-shuttle-timetable';

@Entity('shuttle_timetable')
export class ShuttleTimetable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'route_name', length: 100, unique: true })
  routeName: string;

  @Column({ type: 'jsonb' })
  timetable: ShuttleTimetableMap;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
