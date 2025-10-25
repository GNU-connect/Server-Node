import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cafeteria_diet')
export class CafeteriaDiet {
  @PrimaryGeneratedColumn({ name: 'diet_id' })
  id: number;

  @Column()
  date: Date;

  @Column()
  day: string;

  @Column()
  time: string;

  @Column({ name: 'dish_category' })
  dishCategory: string | null;

  @Column({ name: 'dish_type' })
  dishType: string | null;

  @Column({ name: 'dish_name' })
  dishName: string;

  @ManyToOne(() => Cafeteria, (cafeteria) => cafeteria.cafeteriaDiets)
  @JoinColumn({ name: 'cafeteria_id' })
  cafeteria: Cafeteria;
}
