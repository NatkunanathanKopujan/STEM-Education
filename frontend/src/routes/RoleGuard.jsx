import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RoleGuard({ roles = [], children }) {
  const { homePath, user } = useAuth();

  if (roles.length && user?.role !== 'super-admin' && !roles.includes(user?.role)) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
