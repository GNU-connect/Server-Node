import { DietDate } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';

/** 한국은 연중 UTC+9 (DST 없음). Intl 없이 서울 벽시계 시·분을 쓸 때 사용 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 인스턴트 `date`에 대한 서울 벽시계 시·분 (0–23, 0–59)
 */
const getSeoulHoursMinutes = (date: Date): { hours: number; minutes: number } => {
  const seoul = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    hours: seoul.getUTCHours(),
    minutes: seoul.getUTCMinutes(),
  };
};

/**
 * 내일 날짜를 반환하는 헬퍼 함수
 */
const getTomorrow = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

/**
 * 오늘 또는 내일 날짜 반환
 * - dietDate가 제공되면 해당 날짜 반환
 * - 제공되지 않으면 서울 시간 기준 19시 전후로 오늘/내일 결정
 */
export const getTodayOrTomorrow = (dietDate?: DietDate): Date => {
  if (dietDate) {
    return dietDate === '오늘' ? new Date() : getTomorrow();
  }

  const { hours } = getSeoulHoursMinutes(new Date());
  return hours < 19 ? new Date() : getTomorrow();
};

/**
 * 식단 시간 반환
 * - 서울 시간으로 변환 후 19시 이전이면 아침, 이후면 점심/저녁 결정
 */
export const getDietTime = (date: Date) => {
  const { hours, minutes } = getSeoulHoursMinutes(date);
  const totalMinutes = hours * 60 + minutes;

  const morningStart = 19 * 60; // 19:00
  const morningEnd = 9 * 60 + 30; // 09:30
  const lunchEnd = 13 * 60 + 30; // 13:30

  if (totalMinutes >= morningStart || totalMinutes < morningEnd) {
    return '아침';
  }
  if (totalMinutes >= morningEnd && totalMinutes < lunchEnd) {
    return '점심';
  }
  return '저녁';
};

export const getDayWeek = (date: Date) => {
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];
  return weeks[date.getDay()];
};
