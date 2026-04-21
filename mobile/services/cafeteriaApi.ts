import type { Day } from '@/components/ui/DaySelector';
import type { MealType } from '@/components/ui/MealTypeSelector';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.17:3000/api';

export interface Campus {
  id: number;
  name: string;
  thumbnailUrl: string;
}

export interface Cafeteria {
  id: number;
  name: string;
  thumbnailUrl: string;
  campus: Campus;
}

export interface DietItem {
  category: string | null;
  type: string | null;
  name: string;
}

export interface CafeteriaDiet {
  cafeteria: Cafeteria;
  date: string;
  time: string;
  items: DietItem[];
}

interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API 오류: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as Response<T>;
  return body.data;
}

export function getCampuses(): Promise<Campus[]> {
  return request<Campus[]>('/campuses');
}

export function getCafeterias(campusId: number): Promise<Cafeteria[]> {
  return request<Cafeteria[]>(`/cafeterias?campusId=${campusId}`);
}

export function getCafeteriaDiet(
  cafeteriaId: number,
  date: string,
  time?: MealType,
): Promise<CafeteriaDiet> {
  const params = new URLSearchParams({ date });
  if (time) params.set('time', time);
  return request<CafeteriaDiet>(`/cafeterias/${cafeteriaId}/diet?${params.toString()}`);
}

/**
 * 선택한 요일(월화수목금토일)을 현재 주의 ISO 날짜(YYYY-MM-DD)로 변환합니다.
 */
export function dayToIsoDate(day: Day): string {
  const dayMap: Record<Day, number> = {
    월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6, 일: 0,
  };

  const today = new Date();
  const todayDow = today.getDay(); // 0(일) ~ 6(토)
  const targetDow = dayMap[day];

  let diff = targetDow - todayDow;
  // 같은 주 기준: 일요일(0)이 주의 시작이므로 그대로 사용
  const target = new Date(today);
  target.setDate(today.getDate() + diff);

  return target.toISOString().slice(0, 10);
}
