import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/adminClient';
import type { AdminUser } from '../api/types';

interface AuthValue {
  user: AdminUser | null;
  /** 앱을 열 때 서버에 로그인 상태를 묻는 동안 true */
  loading: boolean;
  /** 틀리면 UnauthorizedError, 잠겼으면 ApiError(429)를 던진다. */
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(me => {
        if (!cancelled) setUser(me);
      })
      // 401이든 네트워크 오류든 로그인 화면으로 보낸다(로딩에 갇히지 않게)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await loginRequest(email.trim(), password));
  }, []);

  const logout = useCallback(() => {
    // 화면은 바로 로그아웃시키고, 서버 세션 삭제는 실패해도 넘어간다
    setUser(null);
    logoutRequest().catch(() => {});
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.');
  return value;
}
