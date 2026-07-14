import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RoleRedirect() {
  const { homePath, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePath} replace />;
}
