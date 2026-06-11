import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('academic_calendar')
export class AcademicCalendar {
  @PrimaryGeneratedColumn({ name: 'academic_id' })
  academicId: number;

  @Column({ name: 'calendar_type', type: 'smallint' })
  calendarType: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'text' })
  content: string;
}
