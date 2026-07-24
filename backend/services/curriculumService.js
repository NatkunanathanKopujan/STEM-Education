import { AppError } from '../utils/appError.js';
import {
  createCurriculumRecord,
  deleteCurriculumRecord,
  findCurriculumById,
  listCurriculums,
  updateCurriculumRecord,
} from '../repositories/curriculumRepository.js';
import { db } from '../config/database.js';
import { findActiveDepartmentById, findDepartmentById } from '../repositories/departmentRepository.js';
import { ensureAdminScopeSchema } from '../repositories/userManagementRepository.js';

const makeCode = (name = '') =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

async function toPayload(payload, user) {
  if (!payload.name?.trim()) {
    throw new AppError('Curriculum name is required', 422);
  }

  const departmentId = Number(payload.departmentId || 0);
  if (!departmentId) {
    throw new AppError('Department is required', 422);
  }

  const department = await findActiveDepartmentById(departmentId);
  if (!department) {
    throw new AppError('Select an active department', 422);
  }

  if (user?.role === 'admin') {
    const fullDepartment = await findDepartmentById(departmentId);
    if (Number(fullDepartment?.createdBy) !== Number(user.id)) {
      throw new AppError('You can only use departments under your campus', 403);
    }
  }

  const assignedTeacherIds = Array.isArray(payload.assignedTeacherIds)
    ? payload.assignedTeacherIds.map(Number).filter(Boolean)
    : [];

  if (user?.role === 'admin' && assignedTeacherIds.length) {
    await ensureAdminScopeSchema();
    const [teachers] = await db.query(
      `SELECT id
       FROM teachers
       WHERE managed_by_admin_id = ?
        AND id IN (${assignedTeacherIds.map(() => '?').join(',')})`,
      [user.id, ...assignedTeacherIds],
    );
    if (teachers.length !== assignedTeacherIds.length) {
      throw new AppError('You can only assign teachers under your campus', 403);
    }
  }

  return {
    name: payload.name.trim(),
    code: (payload.code?.trim() || makeCode(payload.name)) || `CUR-${Date.now()}`,
    description: payload.description?.trim() || '',
    duration: payload.duration?.trim() || '',
    academicYear: payload.academicYear?.trim() || '',
    departmentId: department.id,
    assignedTeacherIds,
    status: payload.status === 'Archived' ? 'Archived' : 'Active',
    createdBy: user?.id || null,
  };
}

function handleDuplicate(error) {
  if (error.code !== 'ER_DUP_ENTRY') throw error;
  throw new AppError('Curriculum code already exists', 409);
}

function ensureCurriculumAccess(curriculum, user) {
  if (user?.role !== 'admin') return;
  if (Number(curriculum?.createdBy) !== Number(user.id)) {
    throw new AppError('You can only manage curriculums under your campus', 403);
  }
}

export const curriculumService = {
  async list(filters, user) {
    return listCurriculums({
      ...filters,
      ...(user?.role === 'admin' ? { createdBy: user.id } : {}),
    });
  },

  async findById(id, user) {
    const curriculum = await findCurriculumById(id);
    if (!curriculum) throw new AppError('Curriculum was not found', 404);
    ensureCurriculumAccess(curriculum, user);
    return curriculum;
  },

  async create(payload, user) {
    try {
      return await createCurriculumRecord(await toPayload(payload, user));
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload, user) {
    await this.findById(id, user);
    try {
      const updated = await updateCurriculumRecord(id, await toPayload(payload, user));
      if (!updated) throw new AppError('Curriculum was not found', 404);
      ensureCurriculumAccess(updated, user);
      return updated;
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async remove(id, user) {
    await this.findById(id, user);
    const deleted = await deleteCurriculumRecord(id);
    if (!deleted) throw new AppError('Curriculum was not found', 404);
    return { id, deleted: true };
  },
};
