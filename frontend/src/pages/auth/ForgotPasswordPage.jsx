import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/toastContextValue';
import { authService } from '../../services/authService';
import { ROLE_LABELS } from '../../utils/constants';

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const selectedRole = searchParams.get('role');
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (values) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await authService.forgotPassword(values);
      setSuccessMessage('If the account exists, reset instructions will be sent.');
      showToast({
        type: 'success',
        title: 'Request received',
        message: 'If the account exists, reset instructions will be sent.',
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to request password reset.';
      setErrorMessage(message);
      showToast({ type: 'error', title: 'Request failed', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Account Recovery
        </p>
        <h2 className="mt-2 text-3xl font-bold text-ink">Forgot password</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Enter your username or email
          {ROLE_LABELS[selectedRole] ? ` for ${ROLE_LABELS[selectedRole]} access` : ''} to
          start the reset process.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <ErrorAlert message={errorMessage} />
        <SuccessAlert message={successMessage} />
        <Input
          label="Username or Email"
          placeholder="username or name@university.edu"
          error={errors.identifier?.message}
          {...register('identifier', { required: 'Username or email is required' })}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send Reset Instructions
        </Button>
      </form>
    </div>
  );
}
