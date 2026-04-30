import {
  getStoredString,
  parseStoredPositiveInteger,
  selectStoredItem,
  setStoredString,
} from '@/utils/storage';

const DIET_CAMPUS_ID_KEY = 'diet.campusId';
const DIET_CAFETERIA_ID_KEY = 'diet.cafeteriaId';
const SHUTTLE_ROUTE_NAME_KEY = 'shuttle.routeName';

export interface DietPreference {
  campusId: number | null;
  cafeteriaId: number | null;
}

export async function getDietPreference(): Promise<DietPreference> {
  const [campusId, cafeteriaId] = await Promise.all([
    getStoredString(DIET_CAMPUS_ID_KEY),
    getStoredString(DIET_CAFETERIA_ID_KEY),
  ]);

  return {
    campusId: parseStoredPositiveInteger(campusId),
    cafeteriaId: parseStoredPositiveInteger(cafeteriaId),
  };
}

export function saveDietCampusId(campusId: number): Promise<void> {
  return setStoredString(DIET_CAMPUS_ID_KEY, String(campusId));
}

export function saveDietCafeteriaId(cafeteriaId: number): Promise<void> {
  return setStoredString(DIET_CAFETERIA_ID_KEY, String(cafeteriaId));
}

export async function getShuttleRoutePreference(): Promise<string | null> {
  return getStoredString(SHUTTLE_ROUTE_NAME_KEY);
}

export function saveShuttleRoutePreference(routeName: string): Promise<void> {
  return setStoredString(SHUTTLE_ROUTE_NAME_KEY, routeName);
}

export function selectByStoredId<T extends { id: number }>(
  items: T[],
  storedId: number | null,
): T | null {
  return selectStoredItem(items, item => item.id === storedId);
}

export function selectByStoredRouteName<T extends { routeName: string }>(
  routes: T[],
  storedRouteName: string | null,
): T | null {
  return selectStoredItem(routes, route => route.routeName === storedRouteName);
}
