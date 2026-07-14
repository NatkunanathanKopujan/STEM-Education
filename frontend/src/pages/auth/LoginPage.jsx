import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import { LoginForm } from '../../components/auth/LoginForm';
import { useToast } from '../../components/ui/toastContextValue';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHomePath, ROLE_LABELS, USER_ROLES } from '../../utils/constants';

const validRoles = Object.values(USER_ROLES);

const getFriendlyError = (error) => {
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.response.status >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  return error.response?.data?.message || 'Unable to sign in. Please check your credentials.';
};

export function LoginPage() {
  const { homePath, isAuthenticated, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();
  const { role } = useParams();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState('');
  const selectedRole = validRoles.includes(role) ? role : null;

  if (isAuthenticated) {
    return <Navigate to={homePath} replace />;
  }

  if (!selectedRole) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (values) => {
    setErrorMessage('');

    try {
      const response = await login(values);

      if (response.user?.role !== selectedRole) {
        await logout({ remote: false });
        const message = `This account is registered as ${ROLE_LABELS[response.user?.role] || 'another role'}. Please choose the correct role.`;
        setErrorMessage(message);
        showToast({ type: 'error', title: 'Role mismatch', message });
        return;
      }

      showToast({
        type: 'success',
        title: 'Login successful',
        message: `Welcome back, ${response.user?.fullName || response.user?.name || 'LMS user'}.`,
      });
      navigate(getRoleHomePath(response.user?.role), { replace: true });
    } catch (error) {
      const message = getFriendlyError(error);
      setErrorMessage(message);
      showToast({ type: 'error', title: 'Login failed', message });
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-primary"
      >
        <FiArrowLeft className="size-4" />
        Back to Role Selection
      </Link>
      <div className="mb-8">
        <span className="grid size-12 place-items-center rounded-xl bg-orange-50 text-primary">
          <FiShield className="size-6" />
        </span>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Secure Access
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Login as {ROLE_LABELS[selectedRole]}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use your university username or email to continue.
        </p>
      </div>

      <LoginForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        errorMessage={errorMessage}
        selectedRole={selectedRole}
      />
    </div>
  );
}
