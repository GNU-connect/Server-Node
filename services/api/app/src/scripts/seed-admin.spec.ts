import { readSeedInput } from './seed-admin';

describe('readSeedInput', () => {
  it('이메일은 공백을 지우고 소문자로 바꾼다', () => {
    expect(
      readSeedInput({
        ADMIN_SEED_EMAIL: '  Admin@Example.com ',
        ADMIN_SEED_PASSWORD: 'long-enough-pw',
      }),
    ).toEqual({ email: 'admin@example.com', password: 'long-enough-pw' });
  });

  it.each([
    ['이메일이 없음', { ADMIN_SEED_PASSWORD: 'long-enough-pw' }],
    ['비밀번호가 없음', { ADMIN_SEED_EMAIL: 'admin@example.com' }],
    ['둘 다 없음', {}],
    ['이메일이 공백뿐', { ADMIN_SEED_EMAIL: '   ', ADMIN_SEED_PASSWORD: 'long-enough-pw' }],
  ])('%s이면 오류', (_name, env) => {
    expect(() => readSeedInput(env)).toThrow(
      'ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD를 모두 설정해 주세요.',
    );
  });

  it('비밀번호가 8자 미만이면 오류', () => {
    expect(() =>
      readSeedInput({ ADMIN_SEED_EMAIL: 'admin@example.com', ADMIN_SEED_PASSWORD: 'short' }),
    ).toThrow('비밀번호는 8자 이상이어야 해요.');
  });

  it('비밀번호가 200자를 넘으면 오류, 200자는 통과', () => {
    const env = { ADMIN_SEED_EMAIL: 'admin@example.com' };
    expect(() => readSeedInput({ ...env, ADMIN_SEED_PASSWORD: 'a'.repeat(201) })).toThrow(
      '비밀번호는 200자 이하여야 해요.',
    );
    expect(readSeedInput({ ...env, ADMIN_SEED_PASSWORD: 'a'.repeat(200) }).password).toHaveLength(
      200,
    );
  });

  it.each(['admin', 'admin@', '@example.com', 'admin@example', 'a b@example.com'])(
    '이메일 형식이 아니면 오류 (%s)',
    email => {
      expect(() =>
        readSeedInput({ ADMIN_SEED_EMAIL: email, ADMIN_SEED_PASSWORD: 'long-enough-pw' }),
      ).toThrow('이메일 형식이 올바르지 않아요.');
    },
  );
});
