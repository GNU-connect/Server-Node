import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reading_room')
export class Clicker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'library_name' })
  libraryName: string;

  @Column({ name: 'reading_room_name' })
  roomName: string;

  @Column({ name: 'total_seats' })
  totalSeats: number;

  @Column({ name: 'is_active' })
  isActive: boolean;
}
