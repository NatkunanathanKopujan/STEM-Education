import { AppError } from '../utils/appError.js';
import {
  createDepartment,
  deleteDepartment,
  findDepartmentById,
  listDepartments,
  updateDepartment,
} from '../repositories/departmentRepository.js';
import { findTeacherDepartmentsByUserId } from '../repositories/userManagementRepository.js';

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

const isAdmin = (user) => user?.role === 'admin';
const isTeacher = (user) => user?.role === 'teacher';

function ensureCanManageDepartments(user) {
  if (isTeacher(user)) {
    throw new AppError('Teachers can only view their assigned departments', 403);
  }
}

function ensureDepartmentAccess(department, user) {
  if (!isAdmin(user)) return;
  if (Number(department?.createdBy) !== Number(user.id)) {
    throw new AppError('You can only manage departments under your campus', 403);
  }
}

export const departmentService = {
  async list(filters, user) {
    if (isTeacher(user)) {
      const departments = await findTeacherDepartmentsByUserId(user.id);
      const search = filters?.search?.trim().toLowerCase();
      const rows = departments
        .filter((department) => !search || department.department.toLowerCase().includes(search))
        .map((department) => ({
          id: department.departmentId,
          name: department.department,
          description: '',
          status: 'Active',
          createdBy: null,
          createdAt: null,
          updatedAt: null,
        }));

      return {
        departments: rows,
        total: rows.length,
        page: 1,
        limit: rows.length || 100,
      };
    }

    return listDepartments({
      ...filters,
      ...(isAdmin(user) ? { createdBy: user.id } : {}),
    });
  },

  async findById(id, user) {
    const department = await findDepartmentById(id);
    if (!department) {
      throw new AppError('Department was not found', 404);
    }
    ensureDepartmentAccess(department, user);
    return department;
  },

  async create(payload, user) {
    ensureCanManageDepartments(user);
    try {
      return await createDepartment({ ...normalizePayload(payload), createdBy: user?.id || null });
    } catch (error) {
      handleDuplicate(error);
    }
    return null;
  },

  async update(id, payload, user) {
    ensureCanManageDepartments(user);
    try {
      await this.findById(id, user);
      const department = await updateDepartment(id, normalizePayload(payload, { partial: true }));
      if (!department) {
        throw new AppError('Department was not found', 404);
      }
      ensureDepartmentAccess(department, user);
      return department;
    } catch (error) {
      handleDuplicate(error);
    }
    return null;
  },

  async remove(id, user) {
    ensureCanManageDepartments(user);
    await this.findById(id, user);
    const deleted = await deleteDepartment(id);
    if (!deleted) {
      throw new AppError('Department was not found', 404);
    }
    return { id, deleted: true };
  },
};
