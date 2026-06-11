import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { College } from 'src/api/public/colleges/domain/entities/college.entity';
import { User } from 'src/api/public/users/domain/entities/users.entity';

@Entity('department')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'college_id' })
  collegeId: number;

  @Column({ name: 'department_ko' })
  name: string;

  @Column({ name: 'department_en' })
  departmentEn: string;

  @Column({ name: 'parent_department_id', nullable: true })
  parentDepartmentId: number;

  @OneToMany(() => User, users => users.department)
  users: User[];

  @ManyToOne(() => College, college => college.departments)
  @JoinColumn({ name: 'college_id' })
  college: College;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'parent_department_id' })
  parentDepartment: Department;
}
