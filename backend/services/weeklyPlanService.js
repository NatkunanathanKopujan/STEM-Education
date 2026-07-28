import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { extractTextFromFile } from '../utils/textExtractor.js';
import { findFileById } from '../repositories/fileRepository.js';
import { markTopicStatus, processMaterial } from './ai/aiContentService.js';
import { auditAction } from './securityService.js';
import {
  adminOwnsDepartment,
  createWeeklyPlanRecord,
  deleteWeeklyPlanRecord,
  findTeacherProfileByUserId,
  findWeeklyPlanById,
  listWeeklyPlans,
  teacherHasDepartment,
  updateWeeklyPlanRecord,
} from '../repositories/weeklyPlanRepository.js';

const writableRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER];

function normalizePayload(payload = {}) {
  const contentType = payload.contentType || 'upcoming';
  const status = payload.status || (contentType === 'completed' ? 'completed' : 'upcoming');
  return {
    courseId: payload.courseId ? Number(payload.courseId) : null,
    teacherId: payload.teacherId ? Number(payload.teacherId) : null,
    departmentId: Number(payload.departmentId),
    contentType,
    weekNo: Number(payload.weekNo),
    topic: payload.topic?.trim(),
    objectives: payload.objectives?.trim() || '',
    activities: payload.activities?.trim() || '',
    resources: payload.resources?.trim() || '',
    attachmentFileId: payload.attachmentFileId ? Number(payload.attachmentFileId) : null,
    resourceLink: payload.resourceLink?.trim() || '',
    plannedDate: payload.plannedDate || null,
    status,
  };
}

function validatePlan(payload) {
  if (!payload.departmentId) throw new AppError('Department is required', 422);
  if (!payload.weekNo || payload.weekNo < 1) throw new AppError('Week number is required', 422);
  if (!payload.topic) throw new AppError('Topic is required', 422);
  if (!['completed', 'upcoming'].includes(payload.contentType)) {
    throw new AppError('Plan type must be completed or upcoming', 422);
  }
  if (!['draft', 'published', 'completed', 'upcoming'].includes(payload.status)) {
    throw new AppError('Invalid weekly plan status', 422);
  }
}

async function resolveTeacherProfile(user, payload) {
  if (user.role === ROLES.TEACHER) {
    const profile = await findTeacherProfileByUserId(user.id);
    if (!profile) throw new AppError('Teacher profile was not found', 404);
    return profile;
  }

  if (!payload.teacherId) {
    throw new AppError('Teacher is required for this weekly plan', 422);
  }

  return { id: payload.teacherId };
}

async function ensureDepartmentWriteAccess(user, departmentId) {
  if (user.role === ROLES.SUPER_ADMIN) return;
  if (user.role === ROLES.ADMIN) {
    if (!(await adminOwnsDepartment(user.id, departmentId))) {
      throw new AppError('You can only manage weekly plans under your campus departments', 403);
    }
    return;
  }
  if (user.role === ROLES.TEACHER && !(await teacherHasDepartment(user.id, departmentId))) {
    throw new AppError('You can only manage weekly plans for your assigned departments', 403);
  }
}

function ensureCanWrite(user) {
  if (!writableRoles.includes(user.role)) {
    throw new AppError('You do not have permission to manage weekly teaching plans', 403);
  }
}

async function syncAiEligibility(user, plan) {
  const topicPayload = {
    curriculumId: null,
    courseId: plan.courseId || null,
    subject: plan.departmentName || 'General',
    weekNo: plan.weekNo,
    topic: plan.topic,
    status: plan.contentType === 'completed' ? 'completed' : 'upcoming',
    teacherId: user.id,
  };

  await markTopicStatus(topicPayload);

  if (plan.contentType !== 'completed') {
    return { aiEligible: false };
  }

  let fileText = '';
  let sourceType = 'weekly_plan';
  if (plan.attachmentFileId) {
    const file = await findFileById(plan.attachmentFileId);
    if (file?.filePath) {
      try {
        fileText = await extractTextFromFile(`backend/${file.filePath}`);
        sourceType = file.fileType === 'pdf' ? 'pdf' : file.fileType === 'documents' ? 'doc' : 'weekly_plan';
      } catch {
        fileText = '';
      }
    }
  }

  const extractedText = [plan.objectives, plan.activities, plan.resources, plan.resourceLink, fileText]
    .filter(Boolean)
    .join('\n\n');

  if (!extractedText.trim()) {
    return { aiEligible: false, reason: 'No completed lesson text available' };
  }

  const result = await processMaterial({
    ...topicPayload,
    extractedText,
    materialId: plan.attachmentFileId || null,
    sourceType,
  });

  return { aiEligible: true, ...result };
}

export async function getWeeklyPlans(user, filters = {}) {
  return listWeeklyPlans(user, filters);
}

export async function createWeeklyPlan(user, payload) {
  ensureCanWrite(user);
  const normalized = normalizePayload(payload);
  validatePlan(normalized);
  await ensureDepartmentWriteAccess(user, normalized.departmentId);
  const teacherProfile = await resolveTeacherProfile(user, normalized);
  const id = await createWeeklyPlanRecord({
    ...normalized,
    teacherId: teacherProfile.id,
    createdByUserId: user.id,
    updatedByUserId: user.id,
  });
  const plan = await findWeeklyPlanById(id);
  const ai = await syncAiEligibility(user, plan);
  await auditAction({
    user,
    action: 'weekly_plan_created',
    module: 'weekly_plans',
    description: `Weekly plan created for Week ${plan.weekNo}: ${plan.topic}`,
    metadata: { weeklyPlanId: plan.id, contentType: plan.contentType, aiEligible: ai.aiEligible },
  });
  return { plan, ai };
}

export async function updateWeeklyPlan(user, id, payload) {
  ensureCanWrite(user);
  const existing = await findWeeklyPlanById(Number(id));
  if (!existing) throw new AppError('Weekly teaching plan was not found', 404);
  await ensureDepartmentWriteAccess(user, existing.departmentId);
  const normalized = normalizePayload({ ...existing, ...payload });
  validatePlan(normalized);
  await ensureDepartmentWriteAccess(user, normalized.departmentId);
  await updateWeeklyPlanRecord(existing.id, { ...normalized, updatedByUserId: user.id });
  const plan = await findWeeklyPlanById(existing.id);
  const ai = await syncAiEligibility(user, plan);
  await auditAction({
    user,
    action: 'weekly_plan_updated',
    module: 'weekly_plans',
    description: `Weekly plan updated for Week ${plan.weekNo}: ${plan.topic}`,
    metadata: { weeklyPlanId: plan.id, contentType: plan.contentType, aiEligible: ai.aiEligible },
  });
  return { plan, ai };
}

export async function deleteWeeklyPlan(user, id) {
  ensureCanWrite(user);
  const existing = await findWeeklyPlanById(Number(id));
  if (!existing) throw new AppError('Weekly teaching plan was not found', 404);
  await ensureDepartmentWriteAccess(user, existing.departmentId);
  const deleted = await deleteWeeklyPlanRecord(existing.id);
  await auditAction({
    user,
    action: 'weekly_plan_deleted',
    module: 'weekly_plans',
    description: `Weekly plan deleted for Week ${existing.weekNo}: ${existing.topic}`,
    metadata: { weeklyPlanId: existing.id },
  });
  return { deleted };
}
