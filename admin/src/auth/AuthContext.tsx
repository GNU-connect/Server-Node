import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getScraperStatuses } from '../api/adminClient';
import { clearApiKey, loadApiKey, saveApiKey } from './keyStorage';

interface AuthValue {
  apiKey: string | null;
  /** 키로 admin API를 한 번 불러 확인한 뒤 저장한다. 틀리면 UnauthorizedError를 던진다. */
  login(key: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => loadApiKey());

  const login = useCallback(async (key: string) => {
    const trimmed = key.trim();
    await getScraperStatuses(trimmed);
    saveApiKey(trimmed);
    setApiKey(trimmed);
  }, []);

  const logout = useCallback(() => {
    clearApiKey();
    setApiKey(null);
  }, []);

  const value = useMemo(() => ({ apiKey, login, logout }), [apiKey, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.');
  return value;
}

/** RequireAuth 안쪽 화면에서 쓰는 키. */
export function useApiKey(): string {
  const { apiKey } = useAuth();
  if (!apiKey) throw new Error('로그인하지 않은 상태에서 useApiKey를 불렀어요.');
  return apiKey;
}
