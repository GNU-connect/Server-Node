import { DietDate } from "src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto";

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
  // 명시적으로 날짜가 지정된 경우
  if (dietDate) {
    return dietDate === '오늘' ? new Date() : getTomorrow(); // 오늘이면 오늘 날짜 반환, 내일이면 내일 날짜 반환
  }

  // 날짜가 지정되지 않은 경우 서울 시간 기준 19시 전후로 오늘/내일 결정
  const currentSeoulTime = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  );
  const currentSeoulTimeHours = currentSeoulTime.getHours();

  return currentSeoulTimeHours < 19 ? new Date() : getTomorrow();
};

/**
 * 식단 시간 반환
 * - 서울 시간으로 변환 후 19시 이전이면 아침, 이후면 점심/저녁 결정
 */
export const getDietTime = (date: Date) => {
  // 서울 시간으로 변환
  const seoulTime = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  );

  const hours = seoulTime.getHours();
  const minutes = seoulTime.getMinutes();

  // 시간을 분 단위로 환산
  const totalMinutes = hours * 60 + minutes;

  // 기준 시간대 (분 단위)
  const morningStart = 19 * 60; // 19:00
  const morningEnd = 9 * 60 + 30; // 09:30
  const lunchEnd = 13 * 60 + 30; // 13:30

  // 아침: 19:00 ~ 다음날 09:30
  if (totalMinutes >= morningStart || totalMinutes < morningEnd) {
    return '아침';
  }
  // 점심: 09:30 ~ 13:30
  else if (totalMinutes >= morningEnd && totalMinutes < lunchEnd) {
    return '점심';
  }
  // 저녁: 나머지 시간
  else {
    return '저녁';
  }
};

export const getDayWeek = (date: Date) => {
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];
  return weeks[date.getDay()];
};
