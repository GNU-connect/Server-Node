import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// react-router v7 동작을 미리 켜 둔다(콘솔 경고 제거)
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { ScrapeRunsPage } from './pages/ScrapeRunsPage';
import { ScrapersPage } from './pages/ScrapersPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/scrapers"
        element={
          <RequireAuth>
            <ScrapersPage />
          </RequireAuth>
        }
      />
      <Route
        path="/scrape-runs"
        element={
          <RequireAuth>
            <ScrapeRunsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/scrapers" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter future={ROUTER_FUTURE}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
