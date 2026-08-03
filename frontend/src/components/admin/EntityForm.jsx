import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCheck, FiChevronDown, FiRefreshCcw, FiSearch, FiX, FiZap } from 'react-icons/fi';
import { Button, SecondaryButton } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordInput, SelectBox, Textarea } from '../ui/FormControls';
import { generatePassword, generateStudentId } from '../../hooks/useEntityManagement';
import { academicYearService } from '../../services/academicYearService';
import { departmentService } from '../../services/departmentService';
import { userManagementService } from '../../services/userManagementService';
import { AuthContext } from '../../context/authContextValue';

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
  const auth = useContext(AuthContext);
  const isTeacherUser = auth?.role === 'teacher';
  const isTeacher = type === 'teacher';
  const isStudent = type === 'student';
  const isCurriculum = type === 'curriculum';
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);
  const [draftDepartmentIds, setDraftDepartmentIds] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState('');
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [curriculumPickerOpen, setCurriculumPickerOpen] = useState(false);
  const [draftCurriculumId, setDraftCurriculumId] = useState('');
  const [draftCurriculumIds, setDraftCurriculumIds] = useState([]);
  const [curriculumsLoading, setCurriculumsLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState('');
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
      departmentIds: [],
      curriculum: '',
      curriculumId: '',
      curriculumIds: [],
      academicYear: '',
      duration: '',
    },
  });

  useEffect(() => {
    if (item) {
      for (const [key, value] of Object.entries(item)) {
        if (key !== 'teachers') {
          setValue(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      if (isTeacher) {
        setValue('departmentId', item.departmentId || '');
        setValue('departmentIds', item.departmentIds || (item.departmentId ? [item.departmentId] : []));
        setValue('curriculumIds', item.curriculumIds || []);
        setValue('curriculum', item.curriculum || '');
      }
      if (isStudent) {
        setValue('departmentId', item.departmentId || '');
        setValue('departmentIds', item.departmentIds || (item.departmentId ? [item.departmentId] : []));
        setValue('department', item.department || '');
        setValue('curriculumId', item.curriculumId || '');
        setValue('curriculum', item.curriculum || '');
      }
    }
  }, [isStudent, isTeacher, item, setValue]);

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
    if (!isTeacher) return undefined;

    let isMounted = true;
    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentError('');
      try {
        const data = await departmentService.list({
          status: 'active',
          limit: 100,
          sort: 'name',
          direction: 'asc',
        });
        if (!isMounted) return;
        const activeDepartments = data.departments || [];
        setDepartmentOptions(activeDepartments);
        const selectedIds = item?.departmentIds || (item?.departmentId ? [item.departmentId] : []);
        if (selectedIds.length) {
          const selectedDepartments = activeDepartments.filter((department) =>
            selectedIds.map(String).includes(String(department.id)),
          );
          setValue('departmentIds', selectedDepartments.map((department) => department.id), { shouldValidate: true });
          setValue('departmentId', selectedDepartments[0]?.id || '', { shouldValidate: true });
          setValue('department', selectedDepartments.map((department) => department.name).join(', '));
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
  }, [isTeacher, item, setValue]);

  useEffect(() => {
    if (!isCurriculum) return undefined;

    let isMounted = true;
    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentError('');
      try {
        const data = await departmentService.list({
          status: 'active',
          limit: 100,
          sort: 'name',
          direction: 'asc',
        });
        if (!isMounted) return;
        setDepartmentOptions(data.departments || []);
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
  }, [isCurriculum]);

  useEffect(() => {
    if (!isStudent) return undefined;

    let isMounted = true;
    const loadStudentDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentError('');
      try {
        if (isTeacherUser) {
          const data = await departmentService.list({
            status: 'active',
            limit: 100,
            sort: 'name',
            direction: 'asc',
          });
          if (!isMounted) return;
          const teacherDepartments = data.departments || [];
          const selectedIds = item?.departmentIds || (item?.departmentId ? [item.departmentId] : []);
          const selectedAllowedIds = selectedIds
            .map(Number)
            .filter((id) => teacherDepartments.some((department) => Number(department.id) === id));
          setDepartmentOptions(teacherDepartments);
          const selectedDepartments = teacherDepartments.filter((department) =>
            selectedAllowedIds.map(String).includes(String(department.id)),
          );
          setValue('departmentIds', selectedAllowedIds, { shouldDirty: true, shouldValidate: true });
          setValue('departmentId', selectedAllowedIds[0] || '', { shouldDirty: true, shouldValidate: true });
          setValue('department', selectedDepartments.map((department) => department.name).join(', '), {
            shouldDirty: true,
            shouldValidate: true,
          });
          if (!teacherDepartments.length) {
            setDepartmentError('Your teacher account is not assigned to an active department.');
          }
          return;
        }

        const data = await departmentService.list({
          status: 'active',
          limit: 100,
          sort: 'name',
          direction: 'asc',
        });
        if (!isMounted) return;
        setDepartmentOptions(data.departments || []);
      } catch {
        if (isMounted) {
          setDepartmentOptions([]);
          setDepartmentError('Unable to load active departments.');
        }
      } finally {
        if (isMounted) setDepartmentsLoading(false);
      }
    };

    loadStudentDepartments();

    const reloadDepartments = (event) => {
      if (!event.detail || event.detail.type === 'department') {
        loadStudentDepartments();
      }
    };
    window.addEventListener('lms:data-changed', reloadDepartments);

    return () => {
      isMounted = false;
      window.removeEventListener('lms:data-changed', reloadDepartments);
    };
  }, [isStudent, isTeacherUser, item, setValue]);

  useEffect(() => {
    if (!isStudent && !isTeacher) return undefined;

    let isMounted = true;
    const loadSelectableCurriculums = async () => {
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
        const activeCurriculums = data.curriculums || [];
        setCurriculumOptions(activeCurriculums);
        if (isStudent) {
          const selected = activeCurriculums.find((curriculum) =>
            String(curriculum.id) === String(item?.curriculumId),
          );
          if (selected) {
            setValue('curriculumId', selected.id, { shouldDirty: true, shouldValidate: true });
            setValue('curriculum', selected.name, { shouldDirty: true, shouldValidate: true });
          }
        }
        if (isTeacher) {
          const selectedIds = (item?.curriculumIds || []).map(Number).filter((id) =>
            activeCurriculums.some((curriculum) => Number(curriculum.id) === id),
          );
          const selectedCurriculums = activeCurriculums.filter((curriculum) =>
            selectedIds.includes(Number(curriculum.id)),
          );
          setValue('curriculumIds', selectedIds, { shouldDirty: true, shouldValidate: true });
          setValue('curriculum', selectedCurriculums.map((curriculum) => curriculum.name).join(', '), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      } catch {
        if (isMounted) {
          setCurriculumOptions([]);
          setCurriculumError('Unable to load active curriculums.');
        }
      } finally {
        if (isMounted) setCurriculumsLoading(false);
      }
    };

    loadSelectableCurriculums();

    const reloadCurriculums = (event) => {
      if (!event.detail || event.detail.type === 'curriculum') {
        loadSelectableCurriculums();
      }
    };
    window.addEventListener('lms:data-changed', reloadCurriculums);

    return () => {
      isMounted = false;
      window.removeEventListener('lms:data-changed', reloadCurriculums);
    };
  }, [isStudent, isTeacher, item, setValue]);

  const password = watch('password');
  const selectedDepartmentIds = (watch('departmentIds') || []).map(Number).filter(Boolean);
  const selectedCurriculumId = watch('curriculumId');
  const selectedCurriculumIds = (watch('curriculumIds') || []).map(Number).filter(Boolean);
  const selectedDepartmentIdSet = new Set(selectedDepartmentIds.map(Number));
  const studentCurriculumOptions = isStudent && selectedDepartmentIds.length
    ? curriculumOptions.filter((curriculum) => selectedDepartmentIdSet.has(Number(curriculum.departmentId)))
    : curriculumOptions;
  const selectedCurriculum = studentCurriculumOptions.find((curriculum) => String(curriculum.id) === String(selectedCurriculumId));
  const selectedCurriculums = curriculumOptions.filter((curriculum) => selectedCurriculumIds.includes(Number(curriculum.id)));
  const selectedDepartments = departmentOptions.filter((department) => selectedDepartmentIds.includes(Number(department.id)));
  const searchedDepartments = departmentOptions.filter((department) =>
    department.name.toLowerCase().includes(departmentSearch.trim().toLowerCase()),
  );
  const visibleDepartmentOptions = departmentSearch.trim() ? searchedDepartments : departmentOptions;
  const visibleCurriculumOptions = (isStudent ? studentCurriculumOptions : curriculumOptions).filter((curriculum) =>
    `${curriculum.name} ${curriculum.code || ''} ${curriculum.departmentName || ''}`
      .toLowerCase()
      .includes(curriculumSearch.trim().toLowerCase()),
  );

  const syncSelectedDepartments = (ids) => {
    const departments = departmentOptions.filter((department) => ids.map(String).includes(String(department.id)));
    setValue('departmentIds', ids, { shouldDirty: true, shouldValidate: true });
    setValue('departmentId', ids[0] || '', { shouldDirty: true, shouldValidate: true });
    setValue('department', departments.map((department) => department.name).join(', '), { shouldDirty: true, shouldValidate: true });
    if (isStudent && selectedCurriculumId) {
      const selected = curriculumOptions.find((curriculum) => String(curriculum.id) === String(selectedCurriculumId));
      const stillAllowed = selected && ids.map(Number).includes(Number(selected.departmentId));
      if (!stillAllowed) {
        setValue('curriculumId', '', { shouldDirty: true, shouldValidate: true });
        setValue('curriculum', '', { shouldDirty: true, shouldValidate: true });
      }
    }
  };

  const removeDepartment = (departmentId) => {
    syncSelectedDepartments(selectedDepartmentIds.filter((id) => Number(id) !== Number(departmentId)));
  };

  const openDepartmentPicker = () => {
    if (departmentsLoading || !departmentOptions.length) return;
    setDraftDepartmentIds(selectedDepartmentIds);
    setDepartmentPickerOpen((isOpen) => !isOpen);
  };

  const toggleDraftDepartment = (departmentId) => {
    const normalizedId = Number(departmentId);
    setDraftDepartmentIds((ids) =>
      ids.includes(normalizedId) ? ids.filter((id) => id !== normalizedId) : [...ids, normalizedId],
    );
  };

  const applyDepartmentSelection = () => {
    syncSelectedDepartments(draftDepartmentIds);
    setDepartmentPickerOpen(false);
  };

  const cancelDepartmentSelection = () => {
    setDraftDepartmentIds(selectedDepartmentIds);
    setDepartmentPickerOpen(false);
  };

  const syncSelectedCurriculums = (ids) => {
    const curriculums = curriculumOptions.filter((curriculum) => ids.map(String).includes(String(curriculum.id)));
    setValue('curriculumIds', ids, { shouldDirty: true, shouldValidate: true });
    setValue('curriculum', curriculums.map((curriculum) => curriculum.name).join(', '), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeCurriculum = (curriculumId) => {
    syncSelectedCurriculums(selectedCurriculumIds.filter((id) => Number(id) !== Number(curriculumId)));
  };

  const openCurriculumPicker = () => {
    if (curriculumsLoading || !curriculumOptions.length) return;
    if (isTeacher) {
      setDraftCurriculumIds(selectedCurriculumIds);
    } else {
      setDraftCurriculumId(selectedCurriculumId || '');
    }
    setCurriculumPickerOpen((isOpen) => !isOpen);
  };

  const toggleDraftCurriculum = (curriculumId) => {
    const normalizedId = Number(curriculumId);
    setDraftCurriculumIds((ids) =>
      ids.includes(normalizedId) ? ids.filter((id) => id !== normalizedId) : [...ids, normalizedId],
    );
  };

  const applyCurriculumSelection = () => {
    if (isTeacher) {
      syncSelectedCurriculums(draftCurriculumIds);
      setCurriculumPickerOpen(false);
      return;
    }
    const selected = curriculumOptions.find((curriculum) => String(curriculum.id) === String(draftCurriculumId));
    setValue('curriculumId', selected?.id || '', { shouldDirty: true, shouldValidate: true });
    setValue('curriculum', selected?.name || '', { shouldDirty: true, shouldValidate: true });
    setCurriculumPickerOpen(false);
  };

  const cancelCurriculumSelection = () => {
    if (isTeacher) {
      setDraftCurriculumIds(selectedCurriculumIds);
    } else {
      setDraftCurriculumId(selectedCurriculumId || '');
    }
    setCurriculumPickerOpen(false);
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
        <div>
          <SelectBox
            label="Department"
            disabled={departmentsLoading || !departmentOptions.length}
            error={errors.departmentId?.message || departmentError}
            options={[
              {
                label: departmentsLoading
                  ? 'Loading departments...'
                  : departmentOptions.length
                    ? 'Select department'
                    : 'No active departments found',
                value: '',
              },
              ...departmentOptions.map((department) => ({
                label: department.name,
                value: department.id,
              })),
            ]}
            {...register('departmentId', { required: 'Department is required' })}
          />
          <p className="mt-1 text-xs text-muted">
            {departmentsLoading ? 'Refreshing active departments...' : 'Only active departments can be selected.'}
          </p>
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
            <input
              type="hidden"
              {...register('departmentIds', {
                validate: (value) => (Array.isArray(value) ? value.length : selectedDepartmentIds.length) > 0 || 'Department is required',
              })}
            />
            <label className="mb-2 block text-sm font-semibold text-ink">Departments</label>
            <button
              type="button"
              onClick={openDepartmentPicker}
              disabled={departmentsLoading || !departmentOptions.length}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:text-muted"
            >
              <span>
                {departmentsLoading
                  ? 'Loading departments...'
                  : selectedDepartmentIds.length
                    ? `${selectedDepartmentIds.length} department${selectedDepartmentIds.length === 1 ? '' : 's'} selected`
                    : departmentOptions.length
                      ? 'Select departments'
                      : 'No active departments found'}
              </span>
              <FiChevronDown className={`transition ${departmentPickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {departmentPickerOpen ? (
              <div className="mt-2 rounded-lg border border-line bg-white p-3 shadow-lg">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={departmentSearch}
                    onChange={(event) => setDepartmentSearch(event.target.value)}
                    placeholder="Search departments"
                    className="w-full rounded-lg border border-line bg-page py-2.5 pl-10 pr-3 text-sm font-semibold text-ink outline-none transition focus:border-primary"
                  />
                </div>
                <div className="mt-3 grid max-h-36 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {visibleDepartmentOptions.length ? (
                    visibleDepartmentOptions.map((department) => {
                      const isSelected = draftDepartmentIds.includes(Number(department.id));
                      return (
                        <button
                          key={department.id}
                          type="button"
                          onClick={() => toggleDraftDepartment(department.id)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-line bg-page text-ink hover:border-primary hover:text-primary'
                          }`}
                        >
                          <span>{department.name}</span>
                          {isSelected ? <FiCheck /> : null}
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-lg border border-line bg-page px-3 py-2 text-sm font-semibold text-muted sm:col-span-2">
                      No active departments found.
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <SecondaryButton onClick={cancelDepartmentSelection}>Cancel</SecondaryButton>
                  <Button type="button" onClick={applyDepartmentSelection}>OK</Button>
                </div>
              </div>
            ) : null}
            {(errors.departmentIds?.message || errors.departmentId?.message || departmentError) ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.departmentIds?.message || errors.departmentId?.message || departmentError}
              </p>
            ) : null}
            {selectedDepartments.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDepartments.map((department) => (
                  <span
                    key={department.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                  >
                    {department.name}
                    <button
                      type="button"
                      className="text-muted transition hover:text-red-600"
                      onClick={() => removeDepartment(department.id)}
                      aria-label={`Remove ${department.name}`}
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <input type="hidden" {...register('departmentId', { required: 'Department is required' })} />
            <input type="hidden" {...register('department')} />
            <p className="mt-1 text-xs text-muted">
              {departmentsLoading ? 'Refreshing active departments...' : 'Only active departments can be selected.'}
            </p>
          </div>
          <div>
            <input
              type="hidden"
              {...register('curriculumIds', {
                validate: (value) => (Array.isArray(value) ? value.length : selectedCurriculumIds.length) > 0 || 'Curriculum is required',
              })}
            />
            <input type="hidden" {...register('curriculum')} />
            <label className="mb-2 block text-sm font-semibold text-ink">Curriculums</label>
            <button
              type="button"
              onClick={openCurriculumPicker}
              disabled={curriculumsLoading || !curriculumOptions.length}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:text-muted"
            >
              <span>
                {curriculumsLoading
                  ? 'Loading curriculums...'
                  : selectedCurriculumIds.length
                    ? `${selectedCurriculumIds.length} curriculum${selectedCurriculumIds.length === 1 ? '' : 's'} selected`
                    : curriculumOptions.length
                      ? 'Select curriculums'
                      : 'No active curriculums found'}
              </span>
              <FiChevronDown className={`transition ${curriculumPickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {curriculumPickerOpen ? (
              <div className="mt-2 rounded-lg border border-line bg-white p-3 shadow-lg">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={curriculumSearch}
                    onChange={(event) => setCurriculumSearch(event.target.value)}
                    placeholder="Search curriculums"
                    className="w-full rounded-lg border border-line bg-page py-2.5 pl-10 pr-3 text-sm font-semibold text-ink outline-none transition focus:border-primary"
                  />
                </div>
                <div className="mt-3 grid max-h-36 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {visibleCurriculumOptions.length ? (
                    visibleCurriculumOptions.map((curriculum) => {
                      const isSelected = draftCurriculumIds.includes(Number(curriculum.id));
                      return (
                        <button
                          key={curriculum.id}
                          type="button"
                          onClick={() => toggleDraftCurriculum(curriculum.id)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-line bg-page text-ink hover:border-primary hover:text-primary'
                          }`}
                        >
                          <span>
                            {curriculum.name}
                            <span className="block text-xs font-medium text-muted">
                              {curriculum.departmentName || curriculum.code || 'Curriculum'}
                            </span>
                          </span>
                          {isSelected ? <FiCheck /> : null}
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-lg border border-line bg-page px-3 py-2 text-sm font-semibold text-muted sm:col-span-2">
                      No active curriculums found.
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <SecondaryButton onClick={cancelCurriculumSelection}>Cancel</SecondaryButton>
                  <Button type="button" onClick={applyCurriculumSelection}>OK</Button>
                </div>
              </div>
            ) : null}
            {(errors.curriculumIds?.message || curriculumError) ? (
              <p className="mt-1 text-xs text-red-600">{errors.curriculumIds?.message || curriculumError}</p>
            ) : null}
            {selectedCurriculums.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCurriculums.map((curriculum) => (
                  <span
                    key={curriculum.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                  >
                    {curriculum.name}
                    <button
                      type="button"
                      className="text-muted transition hover:text-red-600"
                      onClick={() => removeCurriculum(curriculum.id)}
                      aria-label={`Remove ${curriculum.name}`}
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-1 text-xs text-muted">
              {curriculumsLoading ? 'Refreshing active curriculums...' : 'Only active curriculums can be selected.'}
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
            <label className="mb-2 block text-sm font-semibold text-ink">Departments</label>
            <button
              type="button"
              onClick={openDepartmentPicker}
              disabled={departmentsLoading || !departmentOptions.length}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:text-muted"
            >
              <span>
                {departmentsLoading
                  ? 'Loading departments...'
                  : selectedDepartmentIds.length
                    ? `${selectedDepartmentIds.length} department${selectedDepartmentIds.length === 1 ? '' : 's'} selected`
                    : departmentOptions.length
                      ? 'Select departments'
                      : 'No active departments found'}
              </span>
              <FiChevronDown className={`transition ${departmentPickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {departmentPickerOpen ? (
              <div className="mt-2 rounded-lg border border-line bg-white p-3 shadow-lg">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={departmentSearch}
                    onChange={(event) => setDepartmentSearch(event.target.value)}
                    placeholder="Search departments"
                    className="w-full rounded-lg border border-line bg-page py-2.5 pl-10 pr-3 text-sm font-semibold text-ink outline-none transition focus:border-primary"
                  />
                </div>
                <div className="mt-3 grid max-h-36 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {visibleDepartmentOptions.length ? (
                    visibleDepartmentOptions.map((department) => {
                      const isSelected = draftDepartmentIds.includes(Number(department.id));
                      return (
                        <button
                          key={department.id}
                          type="button"
                          onClick={() => toggleDraftDepartment(department.id)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-line bg-page text-ink hover:border-primary hover:text-primary'
                          }`}
                        >
                          <span>{department.name}</span>
                          {isSelected ? <FiCheck /> : null}
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-lg border border-line bg-page px-3 py-2 text-sm font-semibold text-muted sm:col-span-2">
                      No active departments found.
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <SecondaryButton onClick={cancelDepartmentSelection}>Cancel</SecondaryButton>
                  <Button type="button" onClick={applyDepartmentSelection}>OK</Button>
                </div>
              </div>
            ) : null}
            {(errors.departmentIds?.message || errors.departmentId?.message || departmentError) ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.departmentIds?.message || errors.departmentId?.message || departmentError}
              </p>
            ) : null}
            {selectedDepartments.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDepartments.map((department) => (
                  <span
                    key={department.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                  >
                    {department.name}
                    <button
                      type="button"
                      className="text-muted transition hover:text-red-600"
                      onClick={() => removeDepartment(department.id)}
                      aria-label={`Remove ${department.name}`}
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <input
              type="hidden"
              {...register('departmentIds', {
                validate: (value) =>
                  (Array.isArray(value) ? value.length : selectedDepartmentIds.length) > 0 || 'Department is required',
              })}
            />
            <input type="hidden" {...register('departmentId', { required: 'Department is required' })} />
            <input type="hidden" {...register('department')} />
            <p className="mt-1 text-xs text-muted">
              {isTeacherUser
                ? 'Only your assigned departments can be selected.'
                : departmentsLoading
                  ? 'Refreshing active departments...'
                  : 'Only active departments can be selected.'}
            </p>
          </div>
        </>
      ) : null}
      {isStudent ? (
        <div className="md:col-span-2">
          <input type="hidden" {...register('curriculumId', { required: 'Curriculum is required' })} />
          <input type="hidden" {...register('curriculum')} />
          <label className="mb-2 block text-sm font-semibold text-ink">Curriculum</label>
          <button
            type="button"
            onClick={openCurriculumPicker}
            disabled={curriculumsLoading || !curriculumOptions.length}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:text-muted"
          >
            <span>
              {curriculumsLoading
                ? 'Loading curriculums...'
                : selectedCurriculum
                  ? selectedCurriculum.name
                  : curriculumOptions.length
                    ? 'Select curriculum'
                    : 'No active curriculums found'}
            </span>
            <FiChevronDown className={`transition ${curriculumPickerOpen ? 'rotate-180' : ''}`} />
          </button>
          {curriculumPickerOpen ? (
            <div className="mt-2 rounded-lg border border-line bg-white p-3 shadow-lg">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={curriculumSearch}
                  onChange={(event) => setCurriculumSearch(event.target.value)}
                  placeholder="Search curriculums"
                  className="w-full rounded-lg border border-line bg-page py-2.5 pl-10 pr-3 text-sm font-semibold text-ink outline-none transition focus:border-primary"
                />
              </div>
              <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {visibleCurriculumOptions.length ? (
                  visibleCurriculumOptions.map((curriculum) => {
                    const isSelected = String(draftCurriculumId) === String(curriculum.id);
                    return (
                      <button
                        key={curriculum.id}
                        type="button"
                        onClick={() => setDraftCurriculumId(curriculum.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-line bg-page text-ink hover:border-primary hover:text-primary'
                        }`}
                      >
                        <span>
                          {curriculum.name}
                          <span className="block text-xs font-medium text-muted">
                            {curriculum.departmentName || curriculum.code || 'Curriculum'}
                          </span>
                        </span>
                        {isSelected ? <FiCheck /> : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-line bg-page px-3 py-2 text-sm font-semibold text-muted sm:col-span-2">
                    No curriculums found.
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <SecondaryButton onClick={cancelCurriculumSelection}>Cancel</SecondaryButton>
                <Button type="button" onClick={applyCurriculumSelection}>OK</Button>
              </div>
            </div>
          ) : null}
          {(errors.curriculumId?.message || curriculumError) ? (
            <p className="mt-1 text-xs text-red-600">{errors.curriculumId?.message || curriculumError}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            {curriculumsLoading ? 'Refreshing active curriculums...' : 'Only active curriculums can be selected.'}
          </p>
        </div>
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
