import { formatDateTime, formatDuration, formatElapsed } from './format';

// 2026-09-25(금) 15:00 KST
const NOW = new Date('2026-09-25T06:00:00.000Z');

describe('formatDateTime', () => {
  it('오늘이면 "오늘 HH:mm"', () => {
    expect(formatDateTime('2026-09-25T05:20:00.000Z', NOW)).toBe('오늘 14:20');
  });

  it('한국 시각 기준 자정 직후도 오늘로 본다', () => {
    // UTC로는 24일이지만 KST로는 25일 00:30
    expect(formatDateTime('2026-09-24T15:30:00.000Z', NOW)).toBe('오늘 00:30');
  });

  it('다른 날이면 "M월 D일(요일) HH:mm"', () => {
    expect(formatDateTime('2026-09-24T05:05:00.000Z', NOW)).toBe('9월 24일(목) 14:05');
    expect(formatDateTime('2026-09-20T00:00:00.000Z', NOW)).toBe('9월 20일(일) 09:00');
  });
});

describe('formatDuration', () => {
  it('시작 전이면 "-"', () => {
    expect(formatDuration(null, null)).toBe('-');
  });

  it('끝나지 않았으면 "진행 중"', () => {
    expect(formatDuration('2026-09-25T05:20:00.000Z', null)).toBe('진행 중');
  });

  it('1분 미만은 초만, 딱 떨어지는 분은 분만, 나머지는 분과 초', () => {
    expect(formatDuration('2026-09-25T05:20:00.000Z', '2026-09-25T05:20:42.000Z')).toBe('42초');
    expect(formatDuration('2026-09-25T05:20:00.000Z', '2026-09-25T05:23:00.000Z')).toBe('3분');
    expect(formatDuration('2026-09-25T05:20:01.000Z', '2026-09-25T05:21:13.000Z')).toBe('1분 12초');
  });

  it('시계가 어긋나 음수가 나오면 0초', () => {
    expect(formatDuration('2026-09-25T05:20:10.000Z', '2026-09-25T05:20:00.000Z')).toBe('0초');
  });
});

describe('formatElapsed', () => {
  it('1분 미만은 초 전, 그 이상은 분 전', () => {
    expect(formatElapsed(new Date(NOW.getTime() - 3_000), NOW)).toBe('3초 전');
    expect(formatElapsed(new Date(NOW.getTime() - 125_000), NOW)).toBe('2분 전');
  });
});
