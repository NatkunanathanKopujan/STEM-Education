import { AppError } from '../utils/appError.js';
import { hashPassword } from '../utils/password.js';
import {
  findActiveDepartmentByName,
  findDepartmentById,
} from '../repositories/departmentRepository.js';
import {
  findActiveCurriculumByName,
  findCurriculumById,
} from '../repositories/curriculumRepository.js';
import {
  createManagedUser,
  deleteManagedUser,
  findTeacherAdminOwnerByUserId,
  findTeacherCurriculumsByUserId,
  findTeacherDepartmentsByUserId,
  findManagedUserById,
  listManagedUsers,
  updateManagedUser,
} from '../repositories/userManagementRepository.js';

const normalizeStatus = (status) => (status === 'Inactive' || status === 'inactive' ? 'inactive' : 'active');

const roleLabels = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
};

const isSuperAdmin = (actor) => actor?.role === 'super-admin';
const isAdmin = (actor) => actor?.role === 'admin';
const isTeacher = (actor) => actor?.role === 'teacher';

function validatePayload(role, payload, { requirePassword = false } = {}) {
  if (!payload.fullName?.trim()) {
    throw new AppError('Full name is required', 422);
  }
  if (!payload.username?.trim()) {
    throw new AppError('Username is required', 422);
  }
  if (!payload.email?.trim()) {
    throw new AppError('Email is required', 422);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    throw new AppError('Enter a valid email address', 422);
  }
  if (payload.phone && !/^[+()\-\s0-9]{6,30}$/.test(payload.phone)) {
    throw new AppError('Enter a valid phone number', 422);
  }
  if (requirePassword && !payload.password) {
    throw new AppError('Password is required', 422);
  }
  if (payload.password && payload.password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 422);
  }
  if (role === 'student' && !payload.studentId?.trim()) {
    throw new AppError('Student ID is required', 422);
  }

  return {
    fullName: payload.fullName.trim(),
    username: payload.username.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || '',
    status: normalizeStatus(payload.status),
    department: payload.department?.trim() || '',
    departmentId: payload.departmentId ? Number(payload.departmentId) : null,
    departmentIds: normalizeIdArray(payload.departmentIds ?? payload.departmentId),
    curriculumIds: normalizeIdArray(payload.curriculumIds),
    qualification: payload.qualification?.trim() || '',
    employeeNo: payload.employeeNo?.trim() || '',
    studentId: payload.studentId?.trim() || '',
    batch: payload.batch ? String(payload.batch).trim() : '',
    curriculumId: payload.curriculumId ? Number(payload.curriculumId) : null,
    curriculum: payload.curriculum?.trim() || '',
    managedByAdminId: payload.managedByAdminId ? Number(payload.managedByAdminId) : null,
  };
}

function normalizeIdArray(value) {
  const raw = Array.isArray(value) ? value : [value];
  return [...new Set(raw.map(Number).filter(Boolean))];
}

function ensureDepartmentOwner(department, actor, managedByAdminId = null) {
  if (isAdmin(actor) && Number(department.createdBy) !== Number(actor.id)) {
    throw new AppError('You can only use departments under your campus', 403);
  }

  if (isSuperAdmin(actor) && managedByAdminId && department.createdBy && Number(department.createdBy) !== Number(managedByAdminId)) {
    throw new AppError('Selected department does not belong to the assigned admin campus', 403);
  }
}

async function resolveActiveDepartments(ids = [], actor = null, managedByAdminId = null) {
  const departments = [];
  for (const id of ids) {
    const department = await findDepartmentById(id);
    if (!department || department.status !== 'Active') {
      throw new AppError('Select a valid active department', 422);
    }
    ensureDepartmentOwner(department, actor, managedByAdminId);
    departments.push(department);
  }
  return departments;
}

const summarizeDepartments = (departments) => ({
  departmentIds: departments.map((department) => department.id),
  departmentId: departments[0]?.id || null,
  department: departments.map((department) => department.name).join(', '),
});

async function resolveTeacherDepartments(payload, actor) {
  const managedByAdminId = await resolveManagedByAdminId(actor, payload);
  let departments = [];
  if (payload.departmentIds.length) {
    departments = await resolveActiveDepartments(payload.departmentIds, actor, managedByAdminId);
  } else if (payload.departmentId) {
    departments = await resolveActiveDepartments([payload.departmentId], actor, managedByAdminId);
  } else if (payload.department) {
    const names = payload.department.split(',').map((name) => name.trim()).filter(Boolean);
    for (const name of names) {
      const department = await findActiveDepartmentByName(name);
      if (!department) {
        throw new AppError('Select a valid active department', 422);
      }
      const fullDepartment = await findDepartmentById(department.id);
      ensureDepartmentOwner(fullDepartment, actor, managedByAdminId);
      departments.push(department);
    }
  }

  if (!departments.length) {
    throw new AppError('Department is required', 422);
  }

  return summarizeDepartments(departments);
}

async function resolveStudentDepartments(payload, actor) {
  if (isTeacher(actor)) {
    const teacherDepartments = await findTeacherDepartmentsByUserId(actor.id);
    if (!teacherDepartments.length) {
      throw new AppError('Teacher is not assigned to an active department', 403);
    }
    const allowedIds = teacherDepartments.map((department) => Number(department.departmentId));
    const requestedIds = payload.departmentIds.length ? payload.departmentIds : allowedIds;
    const invalid = requestedIds.some((id) => !allowedIds.includes(Number(id)));
    if (invalid) {
      throw new AppError('You can only assign students to your departments', 403);
    }
    const departments = teacherDepartments
      .filter((department) => requestedIds.includes(Number(department.departmentId)))
      .map((department) => ({ id: department.departmentId, name: department.department }));
    return summarizeDepartments(departments);
  }

  if (payload.departmentIds.length) {
    const departments = await resolveActiveDepartments(payload.departmentIds, actor, payload.managedByAdminId);
    if (!departments.length) {
      throw new AppError('Department is required', 422);
    }
    return summarizeDepartments(departments);
  }

  if (payload.departmentId) {
    const departments = await resolveActiveDepartments([payload.departmentId], actor, payload.managedByAdminId);
    return summarizeDepartments(departments);
  }

  if (payload.department) {
    const departments = [];
    const names = payload.department.split(',').map((name) => name.trim()).filter(Boolean);
    for (const name of names) {
      const department = await findActiveDepartmentByName(name);
      if (!department) {
        throw new AppError('Select a valid active department', 422);
      }
      const fullDepartment = await findDepartmentById(department.id);
      ensureDepartmentOwner(fullDepartment, actor, payload.managedByAdminId);
      departments.push(department);
    }
    if (departments.length) {
      return summarizeDepartments(departments);
    }
  }

  throw new AppError('Department is required', 422);
}

async function resolveStudentCurriculum(payload, actor) {
  if (isTeacher(actor) && !payload.curriculumId && !payload.curriculum) {
    throw new AppError('Curriculum is required', 422);
  }

  if (!payload.curriculumId && !payload.curriculum) {
    return { curriculumId: null, curriculum: '' };
  }

  const curriculumByName = payload.curriculumId ? null : await findActiveCurriculumByName(payload.curriculum);
  const curriculum = await findCurriculumById(payload.curriculumId || curriculumByName?.id);

  if (!curriculum || curriculum.status !== 'Active') {
    throw new AppError('Select a valid active curriculum', 422);
  }

  const selectedDepartmentIds = payload.departmentIds.length
    ? payload.departmentIds.map(Number)
    : (payload.departmentId ? [Number(payload.departmentId)] : []);
  if (curriculum.departmentId && selectedDepartmentIds.length && !selectedDepartmentIds.includes(Number(curriculum.departmentId))) {
    throw new AppError('Selected curriculum must belong to one of the selected departments', 422);
  }

  if (isAdmin(actor) && Number(curriculum.createdBy) !== Number(actor.id)) {
    throw new AppError('You can only use curriculums under your campus', 403);
  }

  if (isTeacher(actor)) {
    const [teacherDepartments, teacherCurriculums] = await Promise.all([
      findTeacherDepartmentsByUserId(actor.id),
      findTeacherCurriculumsByUserId(actor.id),
    ]);
    const allowedDepartmentIds = teacherDepartments.map((department) => Number(department.departmentId));
    const allowedCurriculumIds = teacherCurriculums.map((item) => Number(item.curriculumId));
    if (!allowedCurriculumIds.includes(Number(curriculum.id))) {
      throw new AppError('You can only use curriculums assigned to you', 403);
    }
    if (curriculum.departmentId && !allowedDepartmentIds.includes(Number(curriculum.departmentId))) {
      throw new AppError('You can only use curriculums under your assigned departments', 403);
    }
  }

  return {
    curriculumId: curriculum.id,
    curriculum: curriculum.name,
  };
}

async function resolveTeacherCurriculums(payload, actor, managedByAdminId = null) {
  if (!payload.curriculumIds.length) {
    throw new AppError('Curriculum is required', 422);
  }

  const curriculums = [];
  for (const id of payload.curriculumIds) {
    const curriculum = await findCurriculumById(id);
    if (!curriculum || curriculum.status !== 'Active') {
      throw new AppError('Select a valid active curriculum', 422);
    }

    if (isAdmin(actor) && Number(curriculum.createdBy) !== Number(actor.id)) {
      throw new AppError('You can only use curriculums under your campus', 403);
    }

    if (isSuperAdmin(actor) && managedByAdminId && curriculum.createdBy && Number(curriculum.createdBy) !== Number(managedByAdminId)) {
      throw new AppError('Selected curriculum does not belong to the assigned admin campus', 403);
    }

    curriculums.push(curriculum);
  }

  return {
    curriculumIds: curriculums.map((curriculum) => curriculum.id),
    curriculum: curriculums.map((curriculum) => curriculum.name).join(', '),
  };
}

async function ensureTeacherCanAccessStudent(studentId, actor) {
  if (!isTeacher(actor)) return;

  const [teacherDepartments, ownerId] = await Promise.all([
    findTeacherDepartmentsByUserId(actor.id),
    findTeacherAdminOwnerByUserId(actor.id),
  ]);
  if (!teacherDepartments.length) {
    throw new AppError('Teacher is not assigned to an active department', 403);
  }
  if (!ownerId) {
    throw new AppError('Teacher is not assigned under an admin campus', 403);
  }

  const student = await findManagedUserById('student', studentId);
  const teacherIds = teacherDepartments.map((department) => Number(department.departmentId));
  const studentIds = (student?.departmentIds || []).map(Number);
  const hasAccess = studentIds.some((id) => teacherIds.includes(id));
  if (!student || Number(student.managedByAdminId) !== Number(ownerId) || !hasAccess) {
    throw new AppError('You can only manage students in your assigned department', 403);
  }
}

async function resolveManagedByAdminId(actor, current = null) {
  if (isAdmin(actor)) {
    return actor.id;
  }

  if (isTeacher(actor)) {
    const ownerId = await findTeacherAdminOwnerByUserId(actor.id);
    if (!ownerId) {
      throw new AppError('Teacher is not assigned under an admin campus', 403);
    }
    return ownerId;
  }

  return current?.managedByAdminId || null;
}

function ensureAdminCanAccessManagedUser(user, actor) {
  if (!isAdmin(actor)) return;
  if (!user || Number(user.managedByAdminId) !== Number(actor.id)) {
    throw new AppError('You can only manage records under your campus', 403);
  }
}

function ensureCanManageAdminRecords(actor) {
  if (!isSuperAdmin(actor)) {
    throw new AppError('Only Super Admin can manage Admin accounts', 403);
  }
}

function handleDuplicate(error) {
  if (error.code !== 'ER_DUP_ENTRY') {
    throw error;
  }

  throw new AppError('Username, email, employee number, or student ID already exists', 409);
}

export function createUserManagementService(role) {
  const label = roleLabels[role] || 'User';

  return {
    async list(filters, actor) {
      if (role === 'admin') {
        ensureCanManageAdminRecords(actor);
      }

      if ((role === 'teacher' || role === 'student') && isAdmin(actor)) {
        return listManagedUsers(role, { ...filters, managedByAdminId: actor.id });
      }

      if (role === 'student' && isTeacher(actor)) {
        const teacherDepartments = await findTeacherDepartmentsByUserId(actor.id);
        if (!teacherDepartments.length) {
          throw new AppError('Teacher is not assigned to an active department', 403);
        }
        const ownerId = await findTeacherAdminOwnerByUserId(actor.id);
        if (!ownerId) {
          throw new AppError('Teacher is not assigned under an admin campus', 403);
        }
        return listManagedUsers(role, {
          ...filters,
          managedByAdminId: ownerId,
          departmentIds: teacherDepartments.map((department) => department.departmentId),
        });
      }
      return listManagedUsers(role, filters);
    },

    async findById(id, actor) {
      if (role === 'admin') {
        ensureCanManageAdminRecords(actor);
      }
      const user = await findManagedUserById(role, id);
      if (!user) {
        throw new AppError(`${label} was not found`, 404);
      }
      if (role === 'teacher' || role === 'student') {
        ensureAdminCanAccessManagedUser(user, actor);
      }
      if (role === 'student') {
        await ensureTeacherCanAccessStudent(id, actor);
      }
      return user;
    },

    async create(payload, actor) {
      if (role === 'admin') {
        ensureCanManageAdminRecords(actor);
      }
      let userPayload = validatePayload(role, payload, { requirePassword: true });
      if (role === 'teacher') {
        const managedByAdminId = await resolveManagedByAdminId(actor, userPayload);
        userPayload = {
          ...userPayload,
          ...(await resolveTeacherDepartments(userPayload, actor)),
          ...(await resolveTeacherCurriculums(userPayload, actor, managedByAdminId)),
          managedByAdminId,
        };
      } else if (role === 'student') {
        userPayload = {
          ...userPayload,
          ...(await resolveStudentDepartments(userPayload, actor)),
          ...(await resolveStudentCurriculum(userPayload, actor)),
          managedByAdminId: await resolveManagedByAdminId(actor, userPayload),
        };
      }
      const passwordHash = await hashPassword(payload.password);

      try {
        return await createManagedUser(role, { ...userPayload, passwordHash });
      } catch (error) {
        handleDuplicate(error);
      }
    },

    async update(id, payload, actor) {
      if (role === 'admin') {
        ensureCanManageAdminRecords(actor);
      }
      const current = await this.findById(id, actor);
      let userPayload = validatePayload(role, { ...current, ...payload });
      if (role === 'teacher') {
        const managedByAdminId = await resolveManagedByAdminId(actor, current);
        userPayload = {
          ...userPayload,
          ...(await resolveTeacherDepartments(userPayload, actor)),
          ...(await resolveTeacherCurriculums(userPayload, actor, managedByAdminId)),
          managedByAdminId,
        };
      } else if (role === 'student') {
        userPayload = {
          ...userPayload,
          ...(await resolveStudentDepartments(userPayload, actor)),
          ...(await resolveStudentCurriculum(userPayload, actor)),
          managedByAdminId: await resolveManagedByAdminId(actor, current),
        };
      }
      const passwordHash = payload.password ? await hashPassword(payload.password) : null;

      try {
        const updated = await updateManagedUser(role, id, { ...userPayload, passwordHash });
        if (!updated) {
          throw new AppError(`${label} was not found`, 404);
        }
        return updated;
      } catch (error) {
        handleDuplicate(error);
      }
    },

    async remove(id, actor) {
      if (role === 'admin') {
        ensureCanManageAdminRecords(actor);
      }
      if (role === 'teacher' || role === 'student') {
        const current = await this.findById(id, actor);
        ensureAdminCanAccessManagedUser(current, actor);
      }
      if (role === 'student') {
        await ensureTeacherCanAccessStudent(id, actor);
      }
      const deleted = await deleteManagedUser(role, id);
      if (!deleted) {
        throw new AppError(`${label} was not found`, 404);
      }
      return { id, deleted: true };
    },
  };
}
