export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** 401/403. 키가 없거나 틀림 */
export class UnauthorizedError extends ApiError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = 'UnauthorizedError';
  }
}

/** 409. 같은 타입 수집이 이미 대기 또는 실행 중 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('서버에 연결하지 못했어요. 서버가 켜져 있는지 확인해 주세요.');
    this.name = 'NetworkError';
  }
}

/** 화면에 보일 오류 문장. 무엇이 안 됐는지와 할 일을 말한다. */
export function errorText(err: unknown): string {
  if (err instanceof NetworkError) return err.message;
  if (err instanceof ApiError) return `요청이 실패했어요(${err.message}). 잠시 뒤 다시 시도해 주세요.`;
  return '알 수 없는 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.';
}
