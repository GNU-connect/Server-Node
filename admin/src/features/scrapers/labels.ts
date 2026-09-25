import type {
  ScrapeRun,
  ScrapeRunStatus,
  ScrapeRunTrigger,
  ScrapeRunType,
} from '../../api/types';
import type { BadgeTone, IconName } from '../../design/components';

export const TYPE_LABELS: Record<ScrapeRunType, string> = {
  shuttle: '셔틀',
  notice: '공지사항',
  cafeteria: '학식',
  'academic-calendar': '학사 일정',
};

export const TYPE_ICONS: Record<ScrapeRunType, IconName> = {
  shuttle: 'bus',
  notice: 'bell',
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
