import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, setAccount, logout } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      authApi
        .fetchAccount(token)
        .then((account) => setAccount(account))
        .catch(() => logout());
    }
  }, [token, isAuthenticated, setAccount, logout]);

  return <>{children}</>;
}
