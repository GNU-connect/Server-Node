import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cafeteria_nutritional_ingredients')
export class CafeteriaNutritionalIngredientsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cafeteria_id' })
  cafeteriaId: number;

  @Column({ name: 'date' })
  date: Date;

  @Column({ name: 'time' })
  time: string;

  @Column({ name: 'content' })
  content: string;
}
