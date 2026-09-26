import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ScrapeRunTrigger = 'cron' | 'manual';
export type ScrapeRunStatus = 'pending' | 'running' | 'succeeded' | 'failed';

@Entity('scrape_run')
export class ScrapeRun {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target: string | null;

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
