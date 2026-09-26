export const API_KEY_STORAGE_KEY = 'admin.apiKey';

// 탭을 닫으면 사라지도록 sessionStorage에 둔다. 저장소를 못 쓰는 환경에서는 조용히 넘어간다.
export function loadApiKey(): string | null {
  try {
    return sessionStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveApiKey(key: string): void {
  try {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
  } catch {
    // 저장하지 못해도 이번 화면에서는 메모리의 키로 계속 쓴다
  }
}

export function clearApiKey(): void {
  try {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // 지울 수 없는 환경이면 남길 것도 없다
  }
}
