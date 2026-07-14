import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/ui/Loader';

export function ProtectedRoute({ allowedRoles, allowSuperAdmin = true }) {
  const { homePath, isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <Loader label="Verifying session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const superAdminOverride = allowSuperAdmin && user?.role === 'super-admin';

  if (allowedRoles?.length && !superAdminOverride && !allowedRoles.includes(user?.role)) {
    return <Navigate to={homePath} replace />;
  }

  return <Outlet />;
}
