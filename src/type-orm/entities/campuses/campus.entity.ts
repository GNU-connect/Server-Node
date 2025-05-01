import { ReadingRoom } from 'src/type-orm/entities/reading-rooms/reading-rooms.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('campus')
export class Campus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campus_name_ko' })
  name: string;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;

  @OneToMany(() => User, (users) => users.campus)
  users: User[];

  @OneToMany(() => ReadingRoom, (readingRoom) => readingRoom.campus)
  readingRooms: ReadingRoom[];
}
