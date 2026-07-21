import { hashPassword } from '../utils/password.js';
import { AppError } from '../utils/appError.js';
import {
  createAdminRecord,
  deleteAdminRecord,
  findAdminById,
  listAdmins,
  updateAdminRecord,
} from '../repositories/superAdminRepository.js';

const normalizeStatus = (status) => (status === 'Inactive' || status === 'inactive' ? 'inactive' : 'active');

function toAdminPayload(payload, { requirePassword = false } = {}) {
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

  return {
    fullName: payload.fullName.trim(),
    username: payload.username.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || '',
    department: payload.department?.trim() || '',
    status: normalizeStatus(payload.status),
  };
}

function handleDuplicate(error) {
  if (error.code !== 'ER_DUP_ENTRY') {
    throw error;
  }

  throw new AppError('Username, email, or employee number already exists', 409);
}

export const superAdminService = {
  async list(filters) {
    return listAdmins(filters);
  },

  async findById(id) {
    const admin = await findAdminById(id);
    if (!admin) {
      throw new AppError('Admin was not found', 404);
    }
    return admin;
  },

  async create(payload) {
    const adminPayload = toAdminPayload(payload, { requirePassword: true });
    const passwordHash = await hashPassword(payload.password);

    try {
      return await createAdminRecord({ ...adminPayload, passwordHash });
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    if (payload.password || payload.confirmPassword) {
      throw new AppError('Super Admin cannot change an admin password after account creation', 403);
    }

    const current = await this.findById(id);
    const adminPayload = toAdminPayload({ ...current, ...payload });

    try {
      const updated = await updateAdminRecord(id, adminPayload);
      if (!updated) {
        throw new AppError('Admin was not found', 404);
      }
      return updated;
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async remove(id) {
    const deleted = await deleteAdminRecord(id);
    if (!deleted) {
      throw new AppError('Admin was not found', 404);
    }
    return { id, deleted: true };
  },
};
