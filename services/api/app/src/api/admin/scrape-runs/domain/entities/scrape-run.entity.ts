import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const SCRAPE_RUN_TYPES = ['shuttle', 'notice', 'cafeteria', 'academic-calendar'] as const;
export type ScrapeRunType = (typeof SCRAPE_RUN_TYPES)[number];

export const SCRAPE_RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed'] as const;
export type ScrapeRunStatus = (typeof SCRAPE_RUN_STATUSES)[number];

export type ScrapeRunTrigger = 'cron' | 'manual';

@Entity('scrape_run')
export class ScrapeRun {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  type: ScrapeRunType;

  @Column({ length: 10 })
  trigger: ScrapeRunTrigger;

  @Column({ length: 10 })
  status: ScrapeRunStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;
}
