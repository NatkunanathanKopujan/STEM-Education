import { AppError } from '../utils/appError.js';
import { hashPassword } from '../utils/password.js';
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
    qualification: payload.qualification?.trim() || '',
    studentId: payload.studentId?.trim() || '',
    batch: payload.batch ? String(payload.batch).trim() : '',
    curriculum: payload.curriculum?.trim() || '',
  };
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
      const users = await listManagedUsers(role, filters);
      return { users, total: users.length };
    },

    async findById(id) {
      const user = await findManagedUserById(role, id);
      if (!user) {
        throw new AppError(`${label} was not found`, 404);
      }
      return user;
    },

    async create(payload) {
      const userPayload = validatePayload(role, payload, { requirePassword: true });
      const passwordHash = await hashPassword(payload.password);

      try {
        return await createManagedUser(role, { ...userPayload, passwordHash });
      } catch (error) {
        handleDuplicate(error);
      }
    },

    async update(id, payload) {
      const current = await this.findById(id);
      const userPayload = validatePayload(role, { ...current, ...payload });
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
