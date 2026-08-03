import { AppError } from '../utils/appError.js';
import {
  createCurriculumModule,
  createCurriculumRecord,
  deleteCurriculumModule,
  deleteCurriculumRecord,
  findCurriculumModuleById,
  findCurriculumById,
  listCurriculumModules,
  listCurriculums,
  updateCurriculumModule,
  updateCurriculumRecord,
} from '../repositories/curriculumRepository.js';
import { findActiveDepartmentById, findDepartmentById } from '../repositories/departmentRepository.js';
import { findTeacherCurriculumsByUserId } from '../repositories/userManagementRepository.js';

const makeCode = (name = '') =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

function toModulePayload(payload, curriculumId) {
  if (!payload.title?.trim()) {
    throw new AppError('Subject/Module name is required', 422);
  }

  const creditHours = payload.creditHours || payload.creditHours === 0 ? Number(payload.creditHours) : null;
  if (creditHours !== null && (!Number.isFinite(creditHours) || creditHours < 0 || creditHours > 999.9)) {
    throw new AppError('Credit hours must be a valid number', 422);
  }

  return {
    title: payload.title.trim(),
    code: (payload.code?.trim() || makeCode(`${payload.title}-${curriculumId}`)) || `MOD-${Date.now()}`,
    description: payload.description?.trim() || '',
    creditHours,
    status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
  };
}

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

  return {
    name: payload.name.trim(),
    code: (payload.code?.trim() || makeCode(payload.name)) || `CUR-${Date.now()}`,
    description: payload.description?.trim() || '',
    duration: payload.duration?.trim() || '',
    academicYear: payload.academicYear?.trim() || '',
    departmentId: department.id,
    status: payload.status === 'Archived' ? 'Archived' : 'Active',
    createdBy: user?.id || null,
  };
}

function handleDuplicate(error, message = 'Curriculum code already exists') {
  if (error.code !== 'ER_DUP_ENTRY') throw error;
  throw new AppError(message, 409);
}

function ensureCurriculumAccess(curriculum, user) {
  if (user?.role === 'admin' && Number(curriculum?.createdBy) !== Number(user.id)) {
    throw new AppError('You can only manage curriculums under your campus', 403);
  }
}

export const curriculumService = {
  async list(filters, user) {
    return listCurriculums({
      ...filters,
      ...(user?.role === 'admin' ? { createdBy: user.id } : {}),
      ...(user?.role === 'teacher' ? { assignedTeacherUserId: user.id } : {}),
    });
  },

  async findById(id, user) {
    const curriculum = await findCurriculumById(id);
    if (!curriculum) throw new AppError('Curriculum was not found', 404);
    ensureCurriculumAccess(curriculum, user);
    if (user?.role === 'teacher') {
      const assignedCurriculums = await findTeacherCurriculumsByUserId(user.id);
      const hasAccess = assignedCurriculums.some((item) => Number(item.curriculumId) === Number(id));
      if (!hasAccess) {
        throw new AppError('You can only view curriculums assigned to you', 403);
      }
    }
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

  async listModules(curriculumId, user) {
    await this.findById(curriculumId, user);
    return {
      modules: await listCurriculumModules(curriculumId),
    };
  },

  async findModuleById(curriculumId, moduleId, user) {
    await this.findById(curriculumId, user);
    const module = await findCurriculumModuleById(curriculumId, moduleId);
    if (!module) throw new AppError('Subject/Module was not found', 404);
    return module;
  },

  async createModule(curriculumId, payload, user) {
    await this.findById(curriculumId, user);
    try {
      return await createCurriculumModule(curriculumId, toModulePayload(payload, curriculumId));
    } catch (error) {
      handleDuplicate(error, 'Subject/Module code already exists');
    }
  },

  async updateModule(curriculumId, moduleId, payload, user) {
    await this.findModuleById(curriculumId, moduleId, user);
    try {
      const module = await updateCurriculumModule(curriculumId, moduleId, toModulePayload(payload, curriculumId));
      if (!module) throw new AppError('Subject/Module was not found', 404);
      return module;
    } catch (error) {
      handleDuplicate(error, 'Subject/Module code already exists');
    }
  },

  async removeModule(curriculumId, moduleId, user) {
    await this.findModuleById(curriculumId, moduleId, user);
    const deleted = await deleteCurriculumModule(curriculumId, moduleId);
    if (!deleted) throw new AppError('Subject/Module was not found', 404);
    return { id: Number(moduleId), deleted: true };
  },
};
