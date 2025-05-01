import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reading_room')
export class ReadingRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'library_name' })
  libraryName: string;

  @Column({ name: 'reading_room_name' })
  roomName: string;

  @Column({ name: 'total_seats' })
  totalSeats: number;

  @Column({ name: 'is_active' })
  isActive: boolean;

  @ManyToOne(() => Campus, (campus) => campus.readingRooms)
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;
}
