import { ApiError, ConflictError, NetworkError, UnauthorizedError } from './errors';
import type {
  ListScrapeRunsParams,
  ScrapeRun,
  ScrapeRunPage,
  ScrapeRunType,
  ScraperStatus,
} from './types';

const BASE_PATH = '/api/admin';
const ADMIN_API_KEY_HEADER = 'x-admin-api-key';

export function getScraperStatuses(apiKey: string): Promise<ScraperStatus[]> {
  return request(apiKey, '/scrapers');
}

export function listScrapeRuns(
  apiKey: string,
  params: ListScrapeRunsParams = {},
): Promise<ScrapeRunPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();
  return request(apiKey, `/scrape-runs${qs ? `?${qs}` : ''}`);
}

export function getScrapeRun(apiKey: string, id: number): Promise<ScrapeRun> {
  return request(apiKey, `/scrape-runs/${id}`);
}

export function requestScrapeRun(apiKey: string, type: ScrapeRunType): Promise<ScrapeRun> {
  return request(apiKey, '/scrape-runs', { method: 'POST', body: JSON.stringify({ type }) });
}

async function request<T>(apiKey: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [ADMIN_API_KEY_HEADER]: apiKey,
  };
  if (init.body) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${BASE_PATH}${path}`, { ...init, headers });
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
