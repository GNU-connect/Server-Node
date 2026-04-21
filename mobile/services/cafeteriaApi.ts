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

export interface MenuCategory {
  category: string;
  items: string[];
}

export interface CafeteriaDiet {
  cafeteria: Cafeteria;
  date: string;
  time: string;
  menus: MenuCategory[];
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

