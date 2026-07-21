import { AppError } from '../utils/appError.js';
import { hashPassword } from '../utils/password.js';
import {
  findActiveCurriculumById,
  findActiveCurriculumByName,
} from '../repositories/curriculumRepository.js';
import {
  findActiveDepartmentById,
  findActiveDepartmentByName,
} from '../repositories/departmentRepository.js';
import {
  createManagedUser,
  deleteManagedUser,
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
    qualification: payload.qualification?.trim() || '',
    employeeNo: payload.employeeNo?.trim() || '',
    studentId: payload.studentId?.trim() || '',
    batch: payload.batch ? String(payload.batch).trim() : '',
    curriculumId: payload.curriculumId ? Number(payload.curriculumId) : null,
    curriculum: payload.curriculum?.trim() || '',
  };
}

async function resolveTeacherDepartment(payload) {
  if (payload.departmentId) {
    const department = await findActiveDepartmentById(payload.departmentId);
    if (!department) {
      throw new AppError('Select a valid active department', 422);
    }
    return { departmentId: department.id, department: department.name };
  }

  if (payload.department) {
    const department = await findActiveDepartmentByName(payload.department);
    if (!department) {
      throw new AppError('Select a valid active department', 422);
    }
    return { departmentId: department.id, department: department.name };
  }

  throw new AppError('Department is required', 422);
}

async function resolveStudentCurriculum(payload) {
  if (payload.curriculumId) {
    const curriculum = await findActiveCurriculumById(payload.curriculumId);
    if (!curriculum) {
      throw new AppError('Select a valid active curriculum', 422);
    }
    return { curriculumId: curriculum.id, curriculum: curriculum.name };
  }

  if (payload.curriculum) {
    const curriculum = await findActiveCurriculumByName(payload.curriculum);
    if (!curriculum) {
      throw new AppError('Select a valid active curriculum', 422);
    }
    return { curriculumId: curriculum.id, curriculum: curriculum.name };
  }

  throw new AppError('Curriculum is required', 422);
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
    async list(filters) {
      return listManagedUsers(role, filters);
    },

    async findById(id) {
      const user = await findManagedUserById(role, id);
      if (!user) {
        throw new AppError(`${label} was not found`, 404);
      }
      return user;
    },

    async create(payload) {
      let userPayload = validatePayload(role, payload, { requirePassword: true });
      if (role === 'teacher') {
        userPayload = { ...userPayload, ...(await resolveTeacherDepartment(userPayload)) };
      } else if (role === 'student') {
        userPayload = { ...userPayload, ...(await resolveStudentCurriculum(userPayload)) };
      }
      const passwordHash = await hashPassword(payload.password);

      try {
        return await createManagedUser(role, { ...userPayload, passwordHash });
      } catch (error) {
        handleDuplicate(error);
      }
    },

    async update(id, payload) {
      const current = await this.findById(id);
      let userPayload = validatePayload(role, { ...current, ...payload });
      if (role === 'teacher') {
        userPayload = { ...userPayload, ...(await resolveTeacherDepartment(userPayload)) };
      } else if (role === 'student' && ('curriculumId' in payload || 'curriculum' in payload)) {
        userPayload = { ...userPayload, ...(await resolveStudentCurriculum(userPayload)) };
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

    async remove(id) {
      const deleted = await deleteManagedUser(role, id);
      if (!deleted) {
        throw new AppError(`${label} was not found`, 404);
      }
      return { id, deleted: true };
    },
  };
}
