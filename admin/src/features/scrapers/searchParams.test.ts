import { parseRunId, parseStatus, parseType } from './searchParams';

describe('searchParams', () => {
  it('알려진 타입·상태만 받고 나머지는 무시한다', () => {
    expect(parseType('cafeteria')).toBe('cafeteria');
    expect(parseType('foo')).toBeUndefined();
    expect(parseType(null)).toBeUndefined();
    expect(parseStatus('failed')).toBe('failed');
    expect(parseStatus('FAILED')).toBeUndefined();
  });

  it('양의 정수만 run id로 받는다', () => {
    expect(parseRunId('7')).toBe(7);
    expect(parseRunId('abc')).toBeNull();
    expect(parseRunId('0')).toBeNull();
    expect(parseRunId('1.5')).toBeNull();
    expect(parseRunId(null)).toBeNull();
  });
});
