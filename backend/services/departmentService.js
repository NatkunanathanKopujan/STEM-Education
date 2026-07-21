import { AppError } from '../utils/appError.js';
import {
  createDepartment,
  deleteDepartment,
  findDepartmentById,
  listDepartments,
  updateDepartment,
} from '../repositories/departmentRepository.js';

function normalizeStatus(status) {
  return status === 'Inactive' || status === 'inactive' ? 'inactive' : 'active';
}

function normalizePayload(payload = {}, { partial = false } = {}) {
  const normalized = {};

  if (!partial || payload.name !== undefined) {
    if (!payload.name?.trim()) {
      throw new AppError('Department name is required', 422);
    }
    normalized.name = payload.name.trim();
  }

  if (!partial || payload.description !== undefined) {
    normalized.description = payload.description?.trim() || '';
  }

  if (!partial || payload.status !== undefined) {
    normalized.status = normalizeStatus(payload.status);
  }

  return normalized;
}

function handleDuplicate(error) {
  if (error.code !== 'ER_DUP_ENTRY') {
    throw error;
  }
  throw new AppError('Department already exists. Use Edit to update the existing department.', 409);
}

export const departmentService = {
  async list(filters) {
    return listDepartments(filters);
  },

  async findById(id) {
    const department = await findDepartmentById(id);
    if (!department) {
      throw new AppError('Department was not found', 404);
    }
    return department;
  },

  async create(payload, user) {
    try {
      return await createDepartment({ ...normalizePayload(payload), createdBy: user?.id || null });
    } catch (error) {
      handleDuplicate(error);
    }
    return null;
  },

  async update(id, payload) {
    try {
      const department = await updateDepartment(id, normalizePayload(payload, { partial: true }));
      if (!department) {
        throw new AppError('Department was not found', 404);
      }
      return department;
    } catch (error) {
      handleDuplicate(error);
    }
    return null;
  },

  async remove(id) {
    const deleted = await deleteDepartment(id);
    if (!deleted) {
      throw new AppError('Department was not found', 404);
    }
    return { id, deleted: true };
  },
};
