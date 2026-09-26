import { parseRunId, parseStatus, parseTarget, parseType } from './searchParams';

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

  it('영숫자·밑줄·하이픈 50자 이하만 대상 id로 받는다', () => {
    expect(parseTarget('12')).toBe('12');
    expect(parseTarget('dept_1-a')).toBe('dept_1-a');
    expect(parseTarget(null)).toBeUndefined();
    expect(parseTarget('')).toBeUndefined();
    expect(parseTarget('1 OR 1=1')).toBeUndefined();
    expect(parseTarget('a'.repeat(51))).toBeUndefined();
  });
});
