/** 한글 요일 약자 (일요일=0 … 토요일=6) */
export const KOREAN_WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 로컬 날짜 기준 YYYY-MM-DD (타임존은 Date 인스턴스가 이미 반영한 값 사용) */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
