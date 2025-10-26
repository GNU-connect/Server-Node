export const getTodayOrTomorrow = () => {
  const currentSeoulTime = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  );

  const currentSeoulTimeHours = currentSeoulTime.getHours();

  if (currentSeoulTimeHours < 19) {
    return '오늘';
  } else {
    return '내일';
  }
};

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
