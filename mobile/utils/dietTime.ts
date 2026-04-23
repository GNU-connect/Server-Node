/**
 * 모바일 앱 내 식사 시간 라벨 단일 정의 (API·챗봇과 문자열은 맞추되 코드 공유는 하지 않음).
 * 순서는 UI(아침 → 점심 → 저녁)와 동일하게 유지.
 */
export const DIET_TIME_LABELS = ['아침', '점심', '저녁'] as const;
export type DietTimeLabel = (typeof DIET_TIME_LABELS)[number];

/**
 * 서버 `cafeterias/utils/time.ts` 의 getDietTime 과 동일한 KST 구간.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getSeoulHoursMinutes(date: Date): { hours: number; minutes: number } {
  const seoul = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    hours: seoul.getUTCHours(),
    minutes: seoul.getUTCMinutes(),
  };
}

/**
 * 19:00 ~ 09:29: 아침, 09:30 ~ 13:29: 점심, 13:30 ~ 18:59: 저녁 (KST)
 */
export function getDietTime(date: Date): DietTimeLabel {
  const { hours, minutes } = getSeoulHoursMinutes(date);
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
