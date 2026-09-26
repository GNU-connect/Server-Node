import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cafeteria_diet')
export class CafeteriaDiet {
  @PrimaryGeneratedColumn({ name: 'diet_id' })
  id: number;

  @Column({ name: 'cafeteria_id', type: 'bigint' })
  cafeteriaId: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  day: string;

  @Column()
  time: string;

  @Column({ name: 'dish_category', type: 'varchar', nullable: true })
  dishCategory: string | null;

  @Column({ name: 'dish_type', type: 'varchar', nullable: true })
  dishType: string | null;

  @Column({ name: 'dish_name' })
  dishName: string;
}
