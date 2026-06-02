import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

type Props = {
  children: React.ReactNode;
  requiredAuthority?: string;
};

export function ProtectedRoute({ children, requiredAuthority }: Props) {
  const { isAuthenticated, account } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredAuthority && !account?.authorities?.includes(requiredAuthority)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
