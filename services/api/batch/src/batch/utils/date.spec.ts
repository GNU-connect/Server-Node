import { addDays, toKstDateString, toKstYear } from './date';

describe('date utils', () => {
  it('UTC 시각을 KST 날짜로 바꾼다', () => {
    expect(toKstDateString(new Date('2026-09-25T15:30:00Z'))).toBe(
      '2026-09-26',
    );
    expect(toKstDateString(new Date('2026-09-25T14:59:59Z'))).toBe(
      '2026-09-25',
    );
  });

  it('연도 경계에서도 KST 기준 연도를 돌려준다', () => {
    expect(toKstYear(new Date('2026-12-31T16:00:00Z'))).toBe(2027);
    expect(toKstYear(new Date('2026-12-31T14:00:00Z'))).toBe(2026);
  });

  it('날짜 문자열에 일수를 더하고 뺀다', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
