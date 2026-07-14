import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/FormControls';
import { useToast } from '../../components/ui/toastContextValue';
import { authService } from '../../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      token: searchParams.get('token') || '',
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await authService.resetPassword(values);
      setSuccessMessage('Password reset structure completed successfully.');
      showToast({
        type: 'success',
        title: 'Password reset',
        message: 'Password reset structure completed successfully.',
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to reset password.';
      setErrorMessage(message);
      showToast({ type: 'error', title: 'Reset failed', message });
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
        <h2 className="mt-2 text-3xl font-bold text-ink">Reset password</h2>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <ErrorAlert message={errorMessage} />
        <SuccessAlert message={successMessage} />
        <input type="hidden" {...register('token', { required: 'Reset token is required' })} />
        <PasswordInput
          label="New password"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'New password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />
        <PasswordInput
          label="Confirm password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            validate: (value) => value === watch('newPassword') || 'Passwords do not match',
          })}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}
