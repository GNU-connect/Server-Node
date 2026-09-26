import {
  SCRAPE_RUN_STATUSES,
  SCRAPE_RUN_TYPES,
  type ScrapeRunStatus,
  type ScrapeRunType,
} from '../../api/types';

// 주소창 값은 사람이 고칠 수 있으니 서버에 보내기 전에 알려진 값만 남긴다.
export function parseType(value: string | null): ScrapeRunType | undefined {
  return SCRAPE_RUN_TYPES.find(type => type === value);
}

export function parseStatus(value: string | null): ScrapeRunStatus | undefined {
  return SCRAPE_RUN_STATUSES.find(status => status === value);
}

export function parseRunId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

export function parseTarget(value: string | null): string | undefined {
  return value && /^[A-Za-z0-9_-]{1,50}$/.test(value) ? value : undefined;
}
