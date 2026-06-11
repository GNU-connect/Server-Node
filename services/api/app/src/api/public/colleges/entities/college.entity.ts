import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from 'src/api/public/departments/entities/department.entity';

@Entity('college')
export class College {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'college_ko' })
  name: string;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl: string;

  @OneToMany(() => Department, departments => departments.college)
  departments: Department[];
}
