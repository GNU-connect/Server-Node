import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes, ROUTER_FUTURE } from '../App';
import { API_KEY_STORAGE_KEY } from '../auth/keyStorage';
import { AuthProvider } from '../auth/AuthContext';

export function renderApp(path: string, { apiKey }: { apiKey?: string } = {}) {
  if (apiKey) sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
