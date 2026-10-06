import * as argon2 from 'argon2';
import { Client } from 'pg';
// 빌드 결과(dist)를 node로 바로 실행하는 스크립트라 src 별칭 대신 상대 경로를 쓴다
import { normalizeEmail } from '../api/admin/auth/application/normalize-email';

const MIN_PASSWORD_LENGTH = 8;
// 로그인 DTO의 상한과 맞춘다. 넘으면 이 계정으로는 로그인할 수 없다
const MAX_PASSWORD_LENGTH = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SeedInput {
  email: string;
  password: string;
}

export function readSeedInput(env: NodeJS.ProcessEnv): SeedInput {
  const email = normalizeEmail(env.ADMIN_SEED_EMAIL ?? '');
  const password = env.ADMIN_SEED_PASSWORD ?? '';
  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD를 모두 설정해 주세요.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`비밀번호는 ${MAX_PASSWORD_LENGTH}자 이하여야 해요.`);
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('이메일 형식이 올바르지 않아요.');
  }
  return { email, password };
}

async function main(): Promise<void> {
  const { email, password } = readSeedInput(process.env);
  const passwordHash = await argon2.hash(password);

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();
  try {
    const { rows } = await client.query<{ id: number }>(
      `insert into admin_user (email, password_hash) values ($1, $2)
       on conflict (email) do update
         set password_hash = excluded.password_hash, failed_login_count = 0, locked_until = null
       returning id`,
      [email, passwordHash],
    );
    // 비밀번호를 바꿨으니 이전 로그인 세션은 모두 끊는다
    await client.query('delete from admin_session where admin_user_id = $1', [rows[0].id]);
    console.log(`어드민 계정을 저장했어요: ${email}`);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
