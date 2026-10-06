import { ApiError, ConflictError, NetworkError, UnauthorizedError } from './errors';
import type {
  AdminUser,
  ListScrapeRunsParams,
  ScrapeRun,
  ScrapeRunPage,
  ScrapeRunType,
  ScraperStatus,
} from './types';

const BASE_PATH = '/api/admin';

export function getMe(): Promise<AdminUser> {
  return request('/auth/me');
}

export function login(email: string, password: string): Promise<AdminUser> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout(): Promise<null> {
  return request('/auth/logout', { method: 'POST' });
}

export function getScraperStatuses(): Promise<ScraperStatus[]> {
  return request('/scrapers');
}

export function listScrapeRuns(params: ListScrapeRunsParams = {}): Promise<ScrapeRunPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();
  return request(`/scrape-runs${qs ? `?${qs}` : ''}`);
}

export function getScrapeRun(id: number): Promise<ScrapeRun> {
  return request(`/scrape-runs/${id}`);
}

export async function requestScrapeRun(type: ScrapeRunType, target?: string): Promise<ScrapeRun[]> {
  const body = target === undefined ? { type } : { type, target };
  const data = await request<{ runs: ScrapeRun[] }>('/scrape-runs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.runs;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    // 세션 쿠키는 브라우저가 같은 출처 요청에 알아서 붙인다
    response = await fetch(`${BASE_PATH}${path}`, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new NetworkError();
  }

  const body = await readJson(response);
  if (!response.ok) throw toError(response.status, body);
  return (body as { data: T }).data;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toError(status: number, body: unknown): ApiError {
  const message = errorMessage(status, body);
  if (status === 401 || status === 403) return new UnauthorizedError(status, message);
  if (status === 409) return new ConflictError(message);
  return new ApiError(status, message);
}

function errorMessage(status: number, body: unknown): string {
  const raw = body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw) return raw;
  return `HTTP ${status}`;
}
