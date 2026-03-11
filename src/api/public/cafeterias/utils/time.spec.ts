import { getTodayOrTomorrow, getDietTime, getDayWeek } from './time';

describe('getTodayOrTomorrow', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("'오늘'이 주어지면 오늘 날짜를 반환한다", () => {
    const fixedDate = new Date('2024-06-15T05:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const result = getTodayOrTomorrow('오늘');

    expect(result.getDate()).toBe(new Date(fixedDate).getDate());
  });

  it("'내일'이 주어지면 내일 날짜를 반환한다", () => {
    const fixedDate = new Date('2024-06-15T05:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const result = getTodayOrTomorrow('내일');

    const tomorrow = new Date(fixedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.getDate()).toBe(tomorrow.getDate());
  });

  it('dietDate 미입력 시 서울 시간 19시 이전이면 오늘 날짜를 반환한다', () => {
    // UTC 09:59 = Seoul 18:59 → 19시 이전 → 오늘
    const fixedDate = new Date('2024-06-15T09:59:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const result = getTodayOrTomorrow(undefined);
    const today = new Date(fixedDate);

    expect(result.getDate()).toBe(today.getDate());
  });

  it('dietDate 미입력 시 서울 시간 19시 이후면 내일 날짜를 반환한다', () => {
    // UTC 10:01 = Seoul 19:01 → 19시 이후 → 내일
    const fixedDate = new Date('2024-06-15T10:01:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const result = getTodayOrTomorrow(undefined);
    const tomorrow = new Date(fixedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(result.getDate()).toBe(tomorrow.getDate());
  });

  it('dietDate 미입력 시 서울 시간 정확히 19:00이면 내일 날짜를 반환한다', () => {
    // UTC 10:00 = Seoul 19:00 → 내일
    const fixedDate = new Date('2024-06-15T10:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const result = getTodayOrTomorrow(undefined);
    const tomorrow = new Date(fixedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(result.getDate()).toBe(tomorrow.getDate());
  });
});

describe('getDietTime', () => {
  it('서울 시간 09:30 이전이면 아침을 반환한다', () => {
    // UTC 00:00 = Seoul 09:00 → 아침 (09:00 < 09:30)
    const date = new Date('2024-06-15T00:00:00Z');
    expect(getDietTime(date)).toBe('아침');
  });

  it('서울 시간 09:29이면 아침을 반환한다', () => {
    // UTC 00:29 = Seoul 09:29 → 아침
    const date = new Date('2024-06-15T00:29:00Z');
    expect(getDietTime(date)).toBe('아침');
  });

  it('서울 시간 09:30이면 점심을 반환한다', () => {
    // UTC 00:30 = Seoul 09:30 → 점심 (>= 09:30)
    const date = new Date('2024-06-15T00:30:00Z');
    expect(getDietTime(date)).toBe('점심');
  });

  it('서울 시간 13:29이면 점심을 반환한다', () => {
    // UTC 04:29 = Seoul 13:29 → 점심
    const date = new Date('2024-06-15T04:29:00Z');
    expect(getDietTime(date)).toBe('점심');
  });

  it('서울 시간 13:30이면 저녁을 반환한다', () => {
    // UTC 04:30 = Seoul 13:30 → 저녁 (>= 13:30)
    const date = new Date('2024-06-15T04:30:00Z');
    expect(getDietTime(date)).toBe('저녁');
  });

  it('서울 시간 18:59이면 저녁을 반환한다', () => {
    // UTC 09:59 = Seoul 18:59 → 저녁
    const date = new Date('2024-06-15T09:59:00Z');
    expect(getDietTime(date)).toBe('저녁');
  });

  it('서울 시간 19:00이면 아침을 반환한다', () => {
    // UTC 10:00 = Seoul 19:00 → 아침 (>= 19:00)
    const date = new Date('2024-06-15T10:00:00Z');
    expect(getDietTime(date)).toBe('아침');
  });

  it('서울 시간 자정(00:00)이면 아침을 반환한다', () => {
    // UTC 15:00 = Seoul 00:00 → 아침 (< 09:30)
    const date = new Date('2024-06-15T15:00:00Z');
    expect(getDietTime(date)).toBe('아침');
  });
});

describe('getDayWeek', () => {
  it('일요일 날짜에 대해 "일"을 반환한다', () => {
    const sunday = new Date('2024-06-16T00:00:00');
    expect(getDayWeek(sunday)).toBe('일');
  });

  it('월요일 날짜에 대해 "월"을 반환한다', () => {
    const monday = new Date('2024-06-17T00:00:00');
    expect(getDayWeek(monday)).toBe('월');
  });

  it('토요일 날짜에 대해 "토"를 반환한다', () => {
    const saturday = new Date('2024-06-15T00:00:00');
    expect(getDayWeek(saturday)).toBe('토');
  });
});
