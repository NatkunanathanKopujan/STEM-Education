import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiRefreshCcw, FiZap } from 'react-icons/fi';
import { Button, SecondaryButton } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordInput, SelectBox, Textarea } from '../ui/FormControls';
import { generatePassword, generateStudentId } from '../../hooks/useEntityManagement';

export function EntityForm({ type, item, onSubmit, onCancel, generateUsername }) {
  const isTeacher = type === 'teacher';
  const isStudent = type === 'student';
  const isCurriculum = type === 'curriculum';
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: 'Active',
      department: '',
      curriculum: 'Computer Science',
      semester: 'Semester 1',
      academicYear: '2026/2027',
      duration: '',
      assignedTeachers: '',
      assignedStudents: '',
    },
  });

  useEffect(() => {
    if (item) {
      for (const [key, value] of Object.entries(item)) {
        setValue(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }
  }, [item, setValue]);

  const password = watch('password');

  if (isCurriculum) {
    return (
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Curriculum Name" error={errors.name?.message} {...register('name', { required: 'Curriculum name is required' })} />
        <Input label="Duration" {...register('duration', { required: 'Duration is required' })} />
        <Textarea label="Description" className="md:col-span-2" {...register('description')} />
        <SelectBox label="Semester" options={[{ label: 'Semester 1', value: 'Semester 1' }, { label: 'Semester 2', value: 'Semester 2' }]} {...register('semester')} />
        <Input label="Academic Year" {...register('academicYear', { required: 'Academic year is required' })} />
        <Input label="Assigned Teachers" placeholder="Comma separated teacher names" {...register('assignedTeachers')} />
        <Input label="Assigned Students" placeholder="Total assigned students" type="number" {...register('students')} />
        <SelectBox label="Status" options={[{ label: 'Active', value: 'Active' }, { label: 'Archived', value: 'Archived' }]} {...register('status')} />
        <div className="flex justify-end gap-3 md:col-span-2">
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <Button type="submit">{item ? 'Save Curriculum' : 'Create Curriculum'}</Button>
        </div>
      </form>
    );
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {isStudent ? (
        <div className="flex items-end gap-2">
          <Input label="Student ID" error={errors.studentId?.message} {...register('studentId', { required: 'Student ID is required' })} />
          <SecondaryButton className="px-3" onClick={() => setValue('studentId', generateStudentId())} aria-label="Generate student ID">
            <FiRefreshCcw />
          </SecondaryButton>
        </div>
      ) : null}
      <Input label="Full Name" error={errors.fullName?.message} {...register('fullName', { required: 'Full name is required' })} />
      <div className="flex items-end gap-2">
        <Input label="Username" error={errors.username?.message} {...register('username', { required: 'Username is required' })} />
        <SecondaryButton className="px-3" onClick={() => setValue('username', generateUsername(watch('fullName') || `${type} user`))} aria-label="Generate username">
          <FiRefreshCcw />
        </SecondaryButton>
      </div>
      <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' } })} />
      <Input label="Phone Number" {...register('phone')} />
      {isTeacher ? (
        <>
          <Input label="Department" {...register('department', { required: 'Department is required' })} />
          <Input label="Qualification" {...register('qualification', { required: 'Qualification is required' })} />
        </>
      ) : null}
      {isStudent ? (
        <>
          <Input label="Batch" {...register('batch', { required: 'Batch is required' })} />
          <SelectBox label="Curriculum" options={[{ label: 'Computer Science', value: 'Computer Science' }, { label: 'Data Science', value: 'Data Science' }, { label: 'Business Management', value: 'Business Management' }]} {...register('curriculum')} />
        </>
      ) : null}
      <div className="flex items-end gap-2">
        <PasswordInput label="Password" error={errors.password?.message} {...register('password', { required: item ? false : 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })} />
        <SecondaryButton className="px-3" onClick={() => { const generated = generatePassword(); setValue('password', generated); setValue('confirmPassword', generated); }} aria-label="Generate password">
          <FiZap />
        </SecondaryButton>
      </div>
      <PasswordInput label="Confirm Password" error={errors.confirmPassword?.message} {...register('confirmPassword', { validate: (value) => value === password || 'Passwords do not match' })} />
      <SelectBox label="Status" options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} {...register('status')} />
      <div className="flex justify-end gap-3 md:col-span-2">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <Button type="submit">{item ? 'Save Changes' : `Create ${isTeacher ? 'Teacher' : 'Student'}`}</Button>
      </div>
    </form>
  );
}
