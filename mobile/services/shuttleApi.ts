const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.17:3000/api';

export interface ShuttleRoute {
  routeName: string;
  updatedAt: string;
}

export interface TimeEntry {
  time: string;
  memo: string | null;
  status: 'past' | 'next' | 'future';
}

export interface TimetableSection {
  label: string;
  times: TimeEntry[];
}

export interface NextBus {
  time: string;
  minutesUntil: number;
}

export interface ShuttleTimetable {
  routeName: string;
  nextBus: NextBus | null;
  sections: TimetableSection[];
  updatedAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API 오류: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

export function getShuttleRoutes(): Promise<ShuttleRoute[]> {
  return request<ShuttleRoute[]>('/shuttles/routes');
}

export function getShuttleTimetable(routeName: string): Promise<ShuttleTimetable> {
  return request<ShuttleTimetable>(`/shuttles/${encodeURIComponent(routeName)}/timetable`);
}
