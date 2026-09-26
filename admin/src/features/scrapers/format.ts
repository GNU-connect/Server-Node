const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** 오늘이면 "오늘 14:20", 아니면 "9월 24일(목) 14:20". 브라우저 로컬 시간대 기준. */
export function formatDateTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (isSameDay(date, now)) return `오늘 ${time}`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${WEEKDAYS[date.getDay()]}) ${time}`;
}

export function formatDuration(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt) return '-';
  if (!finishedAt) return '진행 중';
  const totalSeconds = Math.max(0, Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}초`;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}

export function formatElapsed(since: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - since.getTime()) / 1000));
  if (seconds < 60) return `${seconds}초 전`;
  return `${Math.floor(seconds / 60)}분 전`;
}
