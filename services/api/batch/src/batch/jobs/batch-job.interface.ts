export const BATCH_JOBS = Symbol('BATCH_JOBS');

export interface BatchJob {
  readonly name: string;

  run(): Promise<void>;
}
