const KST = 'Asia/Seoul';

const kstDateFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 시각을 KST 기준 YYYY-MM-DD로 바꾼다. 배치 서버가 UTC여도 같은 결과가 나온다. */
export function toKstDateString(date: Date): string {
  return kstDateFormat.format(date);
}

export function toKstYear(date: Date): number {
  return Number(toKstDateString(date).slice(0, 4));
}

/** YYYY-MM-DD 문자열에 일수를 더한다(음수 가능). */
export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}
