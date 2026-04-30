import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setStoredString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // 로컬 스토리지 오류가 발생해도 메인 플로우를 막지 않아야 합니다.
  }
}

export function parseStoredPositiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function selectStoredItem<T>(items: T[], isStoredItem: (item: T) => boolean): T | null {
  if (items.length === 0) return null;
  return items.find(isStoredItem) ?? items[0];
}
