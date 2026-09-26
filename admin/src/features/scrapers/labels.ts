import type {
  ScrapeRun,
  ScrapeRunStatus,
  ScrapeRunTrigger,
  ScrapeRunType,
  ScraperStatus,
  ScraperTargetStatus,
} from '../../api/types';
import type { BadgeTone, IconName } from '../../design/components';

export const TYPE_LABELS: Record<ScrapeRunType, string> = {
  shuttle: '셔틀',
  'university-notice': '학교 공지',
  cafeteria: '학식',
  'academic-calendar': '학사 일정',
};

export const TYPE_ICONS: Record<ScrapeRunType, IconName> = {
  shuttle: 'bus',
  'university-notice': 'bell',
  cafeteria: 'meal',
  'academic-calendar': 'calendar',
};

export const TRIGGER_LABELS: Record<ScrapeRunTrigger, string> = {
  cron: '자동',
  manual: '수동',
};

export interface StatusView {
  label: string;
  tone: BadgeTone;
  icon: IconName;
}

export const STATUS_VIEWS: Record<ScrapeRunStatus, StatusView> = {
  pending: { label: '대기 중', tone: 'neutral', icon: 'clock' },
  running: { label: '수집 중', tone: 'blue', icon: 'refresh' },
  succeeded: { label: '성공', tone: 'success', icon: 'check' },
  failed: { label: '실패', tone: 'danger', icon: 'alert' },
};

export const NO_RUN_VIEW: StatusView = { label: '기록 없음', tone: 'neutral', icon: 'info' };

export function isInProgress(run: ScrapeRun | null): boolean {
  return run?.status === 'pending' || run?.status === 'running';
}

/** 대상별 최근 상태를 "성공 11 · 실패 1 · 진행 중 2 · 기록 없음 3" 꼴로 요약한다. 0인 진행 중·기록 없음은 생략한다. */
export function summarizeTargets(targets: ScraperTargetStatus[]): string {
  let succeeded = 0;
  let failed = 0;
  let inProgress = 0;
  let none = 0;

  for (const { latestRun } of targets) {
    if (latestRun === null) none += 1;
    else if (isInProgress(latestRun)) inProgress += 1;
    else if (latestRun.status === 'failed') failed += 1;
    else succeeded += 1;
  }

  const parts = [`성공 ${succeeded}`, `실패 ${failed}`];
  if (inProgress > 0) parts.push(`진행 중 ${inProgress}`);
  if (none > 0) parts.push(`기록 없음 ${none}`);
  return parts.join(' · ');
}

/**
 * 대상이 있는 타입의 type 단위 latestRun은 대상 중 가장 나중에 돈 run일 뿐이라,
 * 한 대상이 실패해도 마지막 대상이 성공이면 성공으로 보인다. 전체 상태는 대상별 최근 run으로 판단한다.
 */
export function failedTargets(status: ScraperStatus): ScraperTargetStatus[] {
  return status.targets.filter(item => item.latestRun?.status === 'failed');
}

export function isFailing(status: ScraperStatus): boolean {
  return status.targets.length > 0
    ? failedTargets(status).length > 0
    : status.latestRun?.status === 'failed';
}

export function isStatusInProgress(status: ScraperStatus): boolean {
  return status.targets.length > 0
    ? status.targets.some(item => isInProgress(item.latestRun))
    : isInProgress(status.latestRun);
}

/** 카드 머리의 배지: 실패가 하나라도 있으면 실패, 아니면 진행 중, 아니면 최근 기록이 있는지에 따라 성공/기록 없음. */
export function overallView(status: ScraperStatus): StatusView {
  if (status.targets.length === 0) {
    return status.latestRun ? STATUS_VIEWS[status.latestRun.status] : NO_RUN_VIEW;
  }
  if (isFailing(status)) return STATUS_VIEWS.failed;
  if (isStatusInProgress(status)) return STATUS_VIEWS.running;
  return status.targets.every(item => item.latestRun === null) ? NO_RUN_VIEW : STATUS_VIEWS.succeeded;
}
