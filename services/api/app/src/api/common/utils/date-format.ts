/** 로컬 달력 기준으로 `YYYY.MM.DD` 문자열을 반환합니다. */
export function formatLocalDateDotSeparated(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
