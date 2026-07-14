import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Checkbox, PasswordInput } from '../ui/FormControls';
import { Input } from '../ui/Input';
import { ErrorAlert } from '../ui/Alerts';

export function LoginForm({ onSubmit, isLoading, errorMessage, selectedRole }) {
  const { role } = useParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      <ErrorAlert message={errorMessage} />
      <Input
        label="Username or Email"
        autoComplete="username"
        placeholder="username or name@university.edu"
        error={errors.identifier?.message}
        {...register('identifier', {
          required: 'Username or email is required',
          minLength: {
            value: 3,
            message: 'Enter at least 3 characters',
          },
        })}
      />
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
          },
        })}
      />
      <div className="flex items-center justify-between gap-3">
        <Checkbox label="Remember me" {...register('rememberMe')} />
        <Link
          to={`/forgot-password?role=${selectedRole || role || ''}`}
          className="text-sm font-semibold text-primary hover:text-primary-dark"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign In
      </Button>
      <Link
        to="/login"
        className="block text-center text-sm font-semibold text-muted transition hover:text-primary"
      >
        Back to Role Selection
      </Link>
    </motion.form>
  );
}
