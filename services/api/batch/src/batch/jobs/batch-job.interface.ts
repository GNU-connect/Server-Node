export const BATCH_JOBS = Symbol('BATCH_JOBS');

export interface BatchJob {
  /** scrape_run.type과 같다. */
  readonly name: string;

  /** 대상별로 run을 나누는 잡만 구현한다. 반환값이 scrape_run.target이 된다. */
  targets?(): Promise<string[]>;

  run(target?: string): Promise<void>;
}
