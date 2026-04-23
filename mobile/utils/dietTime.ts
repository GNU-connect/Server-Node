/**
 * 모바일 앱 내 식사 시간 라벨 단일 정의 (API·챗봇과 문자열은 맞추되 코드 공유는 하지 않음).
 * 순서는 UI(아침 → 점심 → 저녁)와 동일하게 유지.
 */
export const DIET_TIME_LABELS = ['아침', '점심', '저녁'] as const;
export type DietTimeLabel = (typeof DIET_TIME_LABELS)[number];

function getLocalHoursMinutes(date: Date): { hours: number; minutes: number } {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
  };
}

/**
 * 기기 로컬 시각 기준 구간 (날짜 칩 `toIsoDate`와 동일 타임존).
 *
 * 19:00 ~ 09:29: 아침, 09:30 ~ 13:29: 점심, 13:30 ~ 18:59: 저녁
 */
export function getDietTime(date: Date): DietTimeLabel {
  const { hours, minutes } = getLocalHoursMinutes(date);
  const totalMinutes = hours * 60 + minutes;

  const morningStart = 19 * 60;
  const morningEnd = 9 * 60 + 30;
  const lunchEnd = 13 * 60 + 30;

  if (totalMinutes >= morningStart || totalMinutes < morningEnd) {
    return '아침';
  }
  if (totalMinutes >= morningEnd && totalMinutes < lunchEnd) {
    return '점심';
  }
  return '저녁';
}
