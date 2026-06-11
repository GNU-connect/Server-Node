import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/api/public/users/domain/entities/users.entity';

@Entity('campus')
export class Campus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campus_name_ko' })
  name: string;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;

  @OneToMany(() => User, users => users.campus)
  users: User[];

  @OneToMany(() => Cafeteria, cafeterias => cafeterias.campus)
  cafeterias: Cafeteria[];
}
