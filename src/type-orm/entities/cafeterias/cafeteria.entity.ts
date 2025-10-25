import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cafeteria')
export class Cafeteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cafeteria_name_ko' })
  name: string;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;

  @ManyToOne(() => Campus, (campus) => campus.cafeterias)
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @OneToMany(() => CafeteriaDiet, (cafeteriaDiets) => cafeteriaDiets.cafeteria)
  @JoinColumn({ name: 'cafeteria_id' })
  cafeteriaDiets: CafeteriaDiet[];
}
