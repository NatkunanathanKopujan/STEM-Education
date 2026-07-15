import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiRefreshCcw, FiZap } from 'react-icons/fi';
import { Button, SecondaryButton } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordInput, SelectBox } from '../ui/FormControls';
import { generateStrongPassword } from '../../hooks/useAdminManagement';

export function AdminForm({ admin, onSubmit, onCancel, generateUsername }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      department: '',
      role: 'Admin',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (admin) {
      for (const [key, value] of Object.entries(admin)) {
        setValue(key, value);
      }
      setValue('role', 'Admin');
    }
  }, [admin, setValue]);

  const password = watch('password');

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Full Name"
        error={errors.fullName?.message}
        {...register('fullName', { required: 'Full name is required' })}
      />
      <div className="flex items-end gap-2">
        <Input
          label="Username"
          className="flex-1"
          error={errors.username?.message}
          {...register('username', {
            required: 'Username is required',
            pattern: {
              value: /^[a-zA-Z0-9._-]{3,60}$/,
              message: 'Use letters, numbers, dots, underscores, or hyphens',
            },
          })}
        />
        <SecondaryButton
          className="mb-0 px-3"
          onClick={() => setValue('username', generateUsername(watch('fullName') || 'admin user'))}
          aria-label="Generate username"
        >
          <FiRefreshCcw className="size-4" />
        </SecondaryButton>
      </div>
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' },
        })}
      />
      <Input label="Phone Number" {...register('phone')} />
      {!admin ? (
        <>
          <div className="flex items-end gap-2">
            <PasswordInput
              label="Password"
              className="flex-1"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />
            <SecondaryButton
              className="px-3"
              onClick={() => {
                const generated = generateStrongPassword();
                setValue('password', generated);
                setValue('confirmPassword', generated);
              }}
              aria-label="Generate strong password"
            >
              <FiZap className="size-4" />
            </SecondaryButton>
          </div>
          <PasswordInput
            label="Confirm Password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
        </>
      ) : null}
      <Input label="Department" {...register('department', { required: 'Department is required' })} />
      <SelectBox
        label="Role"
        options={[{ label: 'Admin', value: 'Admin' }]}
        {...register('role')}
      />
      <SelectBox
        label="Status"
        options={[
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ]}
        {...register('status')}
      />
      <div className="flex justify-end gap-3 md:col-span-2">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <Button type="submit">{admin ? 'Save Changes' : 'Create Admin'}</Button>
      </div>
    </form>
  );
}
