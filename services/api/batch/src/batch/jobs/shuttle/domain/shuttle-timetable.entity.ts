import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ShuttleTimetableMap } from '../type/parsed-shuttle-timetable';

@Entity('shuttle_timetable')
export class ShuttleTimetable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'route_name', length: 100, unique: true })
  routeName: string;

  @Column({ type: 'jsonb', nullable: false })
  timetable: ShuttleTimetableMap;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({
    name: 'last_success_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastSuccessAt: Date;
}
