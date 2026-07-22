import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiRefreshCcw, FiX, FiZap } from 'react-icons/fi';
import { Button, SecondaryButton } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordInput, SelectBox, Textarea } from '../ui/FormControls';
import { generatePassword, generateStudentId } from '../../hooks/useEntityManagement';
import { academicYearService } from '../../services/academicYearService';
import { departmentService } from '../../services/departmentService';
import { userManagementService } from '../../services/userManagementService';

const qualificationOptions = [
  { label: 'Select qualification', value: '' },
  { label: 'O/L', value: 'O/L' },
  { label: 'A/L', value: 'A/L' },
  { label: 'Diploma', value: 'Diploma' },
  { label: 'HND', value: 'HND' },
  { label: 'Degree', value: 'Degree' },
  { label: "Master's Degree", value: "Master's Degree" },
  { label: 'PhD', value: 'PhD' },
  { label: 'NVQ Level 3', value: 'NVQ Level 3' },
  { label: 'NVQ Level 4', value: 'NVQ Level 4' },
  { label: 'NVQ Level 5', value: 'NVQ Level 5' },
  { label: 'NVQ Level 6', value: 'NVQ Level 6' },
  { label: 'NVQ Level 7', value: 'NVQ Level 7' },
];

export function EntityForm({ type, item, onSubmit, onCancel, generateUsername }) {
  const isTeacher = type === 'teacher';
  const isStudent = type === 'student';
  const isCurriculum = type === 'curriculum';
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentSearch, setDepartmentSearch] = useState(item?.department || '');
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState('');
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [curriculumsLoading, setCurriculumsLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState('');
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherError, setTeacherError] = useState('');
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
      departmentId: '',
      curriculum: '',
      curriculumId: '',
      academicYear: '',
      duration: '',
      assignedTeacherIds: [],
    },
  });

  useEffect(() => {
    if (item) {
      for (const [key, value] of Object.entries(item)) {
        if (key !== 'teachers') {
          setValue(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      if (isCurriculum) {
        setValue('assignedTeacherIds', (item.teachers || []).map((teacher) => teacher.id));
      }
      if (isTeacher) {
        setDepartmentSearch(item.department || '');
        setValue('departmentId', item.departmentId || '');
      }
      if (isStudent) {
        setValue('curriculumId', item.curriculumId || '');
        setValue('curriculum', item.curriculum || '');
      }
    }
  }, [isCurriculum, isStudent, isTeacher, item, setValue]);

  useEffect(() => {
    if (!isCurriculum) return;

    let isMounted = true;
    academicYearService
      .list({ limit: 100 })
      .then((data) => {
        if (!isMounted) return;
        setAcademicYearOptions(
          (data.academicYears || []).map((academicYear) => ({
            label: academicYear.isCurrent ? `${academicYear.name} (Current)` : academicYear.name,
            value: academicYear.name,
          })),
        );
      })
      .catch(() => {
        if (isMounted) {
          setAcademicYearOptions([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCurriculum]);

  useEffect(() => {
    if (!isCurriculum) return undefined;

    let isMounted = true;
    const loadTeachers = async () => {
      setTeachersLoading(true);
      setTeacherError('');
      try {
        const data = await userManagementService.list('teacher', {
          status: 'Active',
          limit: 100,
          sort: 'fullName',
          direction: 'asc',
        });
        if (!isMounted) return;
        setTeacherOptions(data.users || []);
      } catch {
        if (isMounted) {
          setTeacherOptions([]);
          setTeacherError('Unable to load active teachers.');
        }
      } finally {
        if (isMounted) setTeachersLoading(false);
      }
    };

    loadTeachers();

    const reloadTeachers = (event) => {
      if (!event.detail || event.detail.type === 'teacher') {
        loadTeachers();
      }
    };
    window.addEventListener('lms:data-changed', reloadTeachers);

    return () => {
      isMounted = false;
      window.removeEventListener('lms:data-changed', reloadTeachers);
    };
  }, [isCurriculum]);

  useEffect(() => {
    if (!isTeacher) return undefined;

    let isMounted = true;
    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentError('');
      try {
        const data = await departmentService.list({
          status: 'active',
          search: departmentSearch,
          limit: 100,
          sort: 'name',
          direction: 'asc',
        });
        if (!isMounted) return;
        const activeDepartments = data.departments || [];
        setDepartmentOptions(activeDepartments);
        const selected = activeDepartments.find(
          (department) => department.name.toLowerCase() === departmentSearch.trim().toLowerCase(),
        );
        if (selected) {
          setValue('departmentId', selected.id, { shouldValidate: true });
          setValue('department', selected.name);
        } else if (!item?.departmentId || departmentSearch !== item.department) {
          setValue('departmentId', '', { shouldValidate: true });
          setValue('department', departmentSearch);
        }
      } catch {
        if (isMounted) {
          setDepartmentOptions([]);
          setDepartmentError('Unable to load active departments.');
        }
      } finally {
        if (isMounted) setDepartmentsLoading(false);
      }
    };

    loadDepartments();

    const reloadDepartments = (event) => {
      if (!event.detail || event.detail.type === 'department') {
        loadDepartments();
      }
    };
    window.addEventListener('lms:data-changed', reloadDepartments);

    return () => {
      isMounted = false;
      window.removeEventListener('lms:data-changed', reloadDepartments);
    };
  }, [departmentSearch, isTeacher, item, setValue]);

  useEffect(() => {
    if (!isStudent) return undefined;

    let isMounted = true;
    const loadCurriculums = async () => {
      setCurriculumsLoading(true);
      setCurriculumError('');
      try {
        const data = await userManagementService.list('curriculum', {
          status: 'Active',
          limit: 100,
          sort: 'name',
          direction: 'asc',
        });
        if (!isMounted) return;
        setCurriculumOptions(data.curriculums || []);
      } catch {
        if (isMounted) {
          setCurriculumOptions([]);
          setCurriculumError('Unable to load active curriculums.');
        }
      } finally {
        if (isMounted) setCurriculumsLoading(false);
      }
    };

    loadCurriculums();

    const reloadCurriculums = (event) => {
      if (!event.detail || event.detail.type === 'curriculum') {
        loadCurriculums();
      }
    };
    window.addEventListener('lms:data-changed', reloadCurriculums);

    return () => {
      isMounted = false;
      window.removeEventListener('lms:data-changed', reloadCurriculums);
    };
  }, [isStudent]);

  const password = watch('password');
  const selectedTeacherIds = (watch('assignedTeacherIds') || []).map(Number);
  const selectedCurriculumId = watch('curriculumId') || '';
  const selectedTeachers = teacherOptions.filter((teacher) => selectedTeacherIds.includes(Number(teacher.id)));
  const availableTeacherOptions = teacherOptions.filter((teacher) => !selectedTeacherIds.includes(Number(teacher.id)));

  const toggleAssignedTeacher = (teacherId) => {
    const normalizedId = Number(teacherId);
    const nextIds = selectedTeacherIds.includes(normalizedId)
      ? selectedTeacherIds.filter((id) => id !== normalizedId)
      : [...selectedTeacherIds, normalizedId];
    setValue('assignedTeacherIds', nextIds, { shouldDirty: true, shouldValidate: true });
  };

  const addAssignedTeacher = (event) => {
    const teacherId = Number(event.target.value);
    if (teacherId && !selectedTeacherIds.includes(teacherId)) {
      setValue('assignedTeacherIds', [...selectedTeacherIds, teacherId], { shouldDirty: true, shouldValidate: true });
    }
    event.target.value = '';
  };

  const selectStudentCurriculum = (event) => {
    const curriculumId = event.target.value;
    const selected = curriculumOptions.find((curriculum) => String(curriculum.id) === String(curriculumId));
    setValue('curriculumId', curriculumId, { shouldDirty: true, shouldValidate: true });
    setValue('curriculum', selected?.name || '', { shouldDirty: true });
  };

  if (isCurriculum) {
    return (
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Curriculum Name" error={errors.name?.message} {...register('name', { required: 'Curriculum name is required' })} />
        <Input label="Duration" {...register('duration', { required: 'Duration is required' })} />
        <Textarea label="Description" className="md:col-span-2" {...register('description')} />
        <div>
          <Input
            label="Academic Year"
            list="curriculum-academic-year-options"
            placeholder="Select or type academic year"
            error={errors.academicYear?.message}
            {...register('academicYear', { required: 'Academic year is required' })}
          />
          <datalist id="curriculum-academic-year-options">
            {academicYearOptions.map((academicYear) => (
              <option key={academicYear.value} value={academicYear.value}>
                {academicYear.label}
              </option>
            ))}
          </datalist>
          <p className="mt-1 text-xs text-muted">Select an existing academic year or type a new one.</p>
        </div>
        <div className="md:col-span-2">
          <input type="hidden" {...register('assignedTeacherIds')} />
          <SelectBox
            label="Assigned Teachers"
            value=""
            onChange={addAssignedTeacher}
            disabled={teachersLoading || !availableTeacherOptions.length}
            options={[
              {
                label: teachersLoading
                  ? 'Loading teachers...'
                  : selectedTeacherIds.length
                    ? `${selectedTeacherIds.length} teacher${selectedTeacherIds.length === 1 ? '' : 's'} selected`
                    : 'Select teacher',
                value: '',
              },
              ...availableTeacherOptions.map((teacher) => ({
                label: `${teacher.fullName}${teacher.employeeNo || teacher.email ? ` - ${teacher.employeeNo || teacher.email}` : ''}`,
                value: teacher.id,
              })),
            ]}
          />
          {selectedTeachers.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTeachers.map((teacher) => (
                <span
                  key={teacher.id}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                >
                  {teacher.fullName}
                  <button
                    type="button"
                    className="text-muted transition hover:text-red-600"
                    onClick={() => toggleAssignedTeacher(teacher.id)}
                    aria-label={`Remove ${teacher.fullName}`}
                  >
                    <FiX />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          {!teachersLoading && !teacherOptions.length ? (
            <p className="mt-1 text-xs text-muted">No active teachers found. Create active teachers first.</p>
          ) : null}
          {teacherError ? <p className="mt-1 text-xs text-red-600">{teacherError}</p> : null}
        </div>
        <SelectBox
          label="Status"
          options={[{ label: 'Active', value: 'Active' }, { label: 'Archived', value: 'Archived' }]}
          {...register('status')}
        />
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
          <div>
            <Input
              label="Department"
              list="teacher-department-options"
              value={departmentSearch}
              onChange={(event) => setDepartmentSearch(event.target.value)}
              placeholder={departmentsLoading ? 'Loading departments...' : 'Search active departments'}
              error={errors.departmentId?.message || departmentError}
            />
            <datalist id="teacher-department-options">
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.name} />
              ))}
            </datalist>
            <input type="hidden" {...register('departmentId', { required: 'Department is required' })} />
            <input type="hidden" {...register('department')} />
            <p className="mt-1 text-xs text-muted">
              {departmentsLoading ? 'Refreshing active departments...' : 'Only active departments can be selected.'}
            </p>
          </div>
          <SelectBox
            label="Qualification"
            error={errors.qualification?.message}
            options={qualificationOptions}
            {...register('qualification', { required: 'Qualification is required' })}
          />
        </>
      ) : null}
      {isStudent ? (
        <>
          <Input label="Batch" {...register('batch', { required: 'Batch is required' })} />
          <div>
            <SelectBox
              label="Curriculum / Course"
              value={selectedCurriculumId}
              onChange={selectStudentCurriculum}
              disabled={curriculumsLoading || !curriculumOptions.length}
              error={errors.curriculumId?.message || curriculumError}
              options={[
                {
                  label: curriculumsLoading
                    ? 'Loading curriculums...'
                    : curriculumOptions.length
                      ? 'Select curriculum / course'
                      : 'No active curriculums found',
                  value: '',
                },
                ...curriculumOptions.map((curriculum) => ({
                  label: curriculum.code ? `${curriculum.code} - ${curriculum.name}` : curriculum.name,
                  value: curriculum.id,
                })),
              ]}
            />
            <input type="hidden" {...register('curriculumId', { required: 'Curriculum is required' })} />
            <input type="hidden" {...register('curriculum')} />
            <p className="mt-1 text-xs text-muted">
              {curriculumsLoading ? 'Refreshing active curriculums...' : 'Only active curriculums can be selected.'}
            </p>
          </div>
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
