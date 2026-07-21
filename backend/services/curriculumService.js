import { AppError } from '../utils/appError.js';
import {
  createCurriculumRecord,
  deleteCurriculumRecord,
  findCurriculumById,
  listCurriculums,
  updateCurriculumRecord,
} from '../repositories/curriculumRepository.js';

const makeCode = (name = '') =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

function toPayload(payload, user) {
  if (!payload.name?.trim()) {
    throw new AppError('Curriculum name is required', 422);
  }

  return {
    name: payload.name.trim(),
    code: (payload.code?.trim() || makeCode(payload.name)) || `CUR-${Date.now()}`,
    description: payload.description?.trim() || '',
    status: payload.status === 'Archived' ? 'Archived' : 'Active',
    createdBy: user?.id || null,
  };
}

function handleDuplicate(error) {
  if (error.code !== 'ER_DUP_ENTRY') throw error;
  throw new AppError('Curriculum code already exists', 409);
}

export const curriculumService = {
  async list(filters) {
    return listCurriculums(filters);
  },

  async findById(id) {
    const curriculum = await findCurriculumById(id);
    if (!curriculum) throw new AppError('Curriculum was not found', 404);
    return curriculum;
  },

  async create(payload, user) {
    try {
      return await createCurriculumRecord(toPayload(payload, user));
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    await this.findById(id);
    try {
      const updated = await updateCurriculumRecord(id, toPayload(payload));
      if (!updated) throw new AppError('Curriculum was not found', 404);
      return updated;
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async remove(id) {
    const deleted = await deleteCurriculumRecord(id);
    if (!deleted) throw new AppError('Curriculum was not found', 404);
    return { id, deleted: true };
  },
};
