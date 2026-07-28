import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { getFileCategory, getFileExtension } from '../utils/fileHelper.js';
import { findDepartmentById } from '../repositories/departmentRepository.js';
import { findCurriculumById, findCurriculumModuleById } from '../repositories/curriculumRepository.js';
import {
  canAccessFile,
  canAccessFileRecord,
  createFileRecord,
  createFileVersion,
  deleteFileRecord,
  findDuplicate,
  findTeacherAssignableFileDepartments,
  findFileIdByVersion,
  findFileById,
  getStorageStatistics,
  listFiles,
  listFileVersions,
  recordDownload,
  recordPreview,
  restoreVersion,
  syncFileDepartments,
  updateFileRecord,
} from '../repositories/fileRepository.js';
import { getStorageProvider } from './storageProviderService.js';
import { performanceMetricsService } from './performanceMetricsService.js';
import { auditAction } from './securityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

function getUserId(user) {
  return user?.id || user?.userId;
}

function toRelativeUploadPath(filePath) {
  return path.relative(backendRoot, filePath).replace(/\\/g, '/');
}

function buildLogicalFolder({ curriculum, subject, weekNo, topic, uploadedRole }) {
  const parts = [uploadedRole === ROLES.STUDENT ? 'Assignments' : 'Curriculum', curriculum, subject];
  if (weekNo) parts.push(`Week ${weekNo}`);
  if (topic) parts.push(topic);
  return parts.filter(Boolean).join('/');
}

async function resolveLearningScope(user, body = {}) {
  if (user.role === ROLES.STUDENT || body.parentFileId) return {};

  const departmentId = Number(body.departmentId || body.departmentIds || 0);
  const curriculumId = Number(body.curriculumId || 0);
  const courseId = Number(body.courseId || 0);
  const weekNo = Number(body.weekNo || 0);

  if (!departmentId) throw new AppError('Department is required', 400);
  if (!curriculumId) throw new AppError('Curriculum is required', 400);
  if (!courseId) throw new AppError('Subject/Module is required', 400);
  if (!weekNo || weekNo < 1) throw new AppError('Week number is required', 400);

  const department = await findDepartmentById(departmentId);
  if (!department || department.status !== 'Active') {
    throw new AppError('Select a valid active department', 400);
  }
  if (user.role === ROLES.ADMIN && Number(department.createdBy) !== Number(getUserId(user))) {
    throw new AppError('You can only upload materials under your campus departments', 403);
  }
  if (user.role === ROLES.TEACHER) {
    const assignedDepartments = await findTeacherAssignableFileDepartments(getUserId(user));
    const assignedIds = assignedDepartments.map((item) => Number(item.departmentId));
    if (!assignedIds.includes(departmentId)) {
      throw new AppError('You can only upload materials under your assigned departments', 403);
    }
  }

  const curriculum = await findCurriculumById(curriculumId);
  if (!curriculum || curriculum.status !== 'Active') {
    throw new AppError('Select a valid active curriculum', 400);
  }
  if (Number(curriculum.departmentId) !== departmentId) {
    throw new AppError('Selected curriculum does not belong to the selected department', 400);
  }
  if (user.role === ROLES.ADMIN && Number(curriculum.createdBy) !== Number(getUserId(user))) {
    throw new AppError('You can only upload materials under your campus curriculums', 403);
  }

  const module = await findCurriculumModuleById(curriculumId, courseId);
  if (!module || module.status !== 'Active') {
    throw new AppError('Select a valid active subject/module', 400);
  }

  return {
    departmentId,
    curriculumId,
    courseId,
    curriculum: curriculum.name,
    subject: module.title,
    weekNo,
  };
}

async function calculateChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });

  return hash.digest('hex');
}

function normalizeMetadata(user, file, body = {}) {
  const originalFileName = file.originalname;
  const fileType = getFileCategory(originalFileName);
  const uploadedRole = user.role;
  const visibility = uploadedRole === ROLES.STUDENT ? 'private' : body.visibility || 'private';
  const audience = uploadedRole === ROLES.STUDENT ? ROLES.TEACHER : body.audience || 'all';
  const status = uploadedRole === ROLES.STUDENT ? 'active' : body.status || 'active';

  return {
    fileName: file.filename,
    originalFileName,
    fileType,
    mimeType: file.mimetype,
    fileSize: file.size,
    filePath: toRelativeUploadPath(file.path),
    uploadedBy: getUserId(user),
    uploadedRole,
    curriculum: body.curriculum,
    subject: body.subject,
    courseId: body.courseId ? Number(body.courseId) : null,
    weekNo: body.weekNo ? Number(body.weekNo) : null,
    topic: body.topic,
    description: body.description,
    versionNote: body.versionNote,
    visibility,
    audience,
    status,
    tags: body.tags,
    logicalFolder: buildLogicalFolder({ ...body, uploadedRole }),
    storageProvider: getStorageProvider().name,
  };
}

function normalizeDepartmentIds(value) {
  if (value === undefined || value === null || value === '') return [];
  const values = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(values.map((item) => Number(item)).filter(Boolean))];
}

async function resolveFileTargetDepartments(user, body = {}) {
  const learningDepartmentId = Number(body.departmentId || 0);
  if (learningDepartmentId) {
    body.departmentIds = [learningDepartmentId];
  }

  if (!learningDepartmentId && ![ROLES.STUDENT, ROLES.TEACHER].includes(body.audience)) {
    return [];
  }

  const requestedIds = normalizeDepartmentIds(body.departmentIds);
  if (!requestedIds.length) {
    throw new AppError('Select at least one department for this audience', 400);
  }

  if (user.role === ROLES.TEACHER) {
    const assignedDepartments = await findTeacherAssignableFileDepartments(getUserId(user));
    const assignedIds = assignedDepartments.map((department) => Number(department.departmentId));
    const invalidIds = requestedIds.filter((departmentId) => !assignedIds.includes(departmentId));
    if (invalidIds.length) {
      throw new AppError('You can only share materials with your assigned departments', 403);
    }
    return requestedIds;
  }

  for (const departmentId of requestedIds) {
    const department = await findDepartmentById(departmentId);
    if (!department || department.status !== 'Active') {
      throw new AppError('Select valid active departments for this audience', 400);
    }
    if (user.role === ROLES.ADMIN && Number(department.createdBy) !== Number(getUserId(user))) {
      throw new AppError('You can only share materials with departments under your campus', 403);
    }
  }

  return requestedIds;
}

function ensureUploadAllowed(user) {
  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT].includes(user.role)) {
    throw new AppError('You do not have permission to upload files', 403);
  }
}

function ensureStudentUploadAllowed(user, body = {}) {
  if (user.role !== ROLES.STUDENT) return;

  if (body.parentFileId) {
    throw new AppError('Students cannot create versions of managed learning files', 403);
  }

  const allowedVisibility = !body.visibility || body.visibility === 'private';
  const allowedAudience = !body.audience || body.audience === ROLES.TEACHER;
  const allowedStatus = !body.status || body.status === 'active';
  if (!allowedVisibility || !allowedAudience || !allowedStatus) {
    throw new AppError('Student uploads must remain private assignment or presentation submissions', 403);
  }
}

function ensureManageAllowed(user, file) {
  if (!canAccessFile(user, file, 'write')) {
    throw new AppError('You do not have permission to manage this file', 403);
  }
}

export async function uploadManagedFile(user, file, body = {}) {
  const startedAt = Date.now();
  ensureUploadAllowed(user);
  ensureStudentUploadAllowed(user, body);
  if (!file) throw new AppError('File is required', 400);

  const learningScope = await resolveLearningScope(user, body);
  const scopedBody = { ...body, ...learningScope };
  const targetDepartmentIds = await resolveFileTargetDepartments(user, scopedBody);
  const metadata = normalizeMetadata(user, file, scopedBody);
  metadata.checksum = await calculateChecksum(file.path);

  if (body.parentFileId) {
    const parent = await findFileById(Number(body.parentFileId));
    ensureManageAllowed(user, parent);
    const versionId = await createFileVersion(parent.id, metadata);
    await syncFileDepartments(parent.id, targetDepartmentIds);
    const parentRecord = await findFileById(parent.id);
    performanceMetricsService.recordUpload({
      fileSize: file.size,
      durationMs: Date.now() - startedAt,
      speedMbps: Number(((file.size / 1024 / 1024) / Math.max((Date.now() - startedAt) / 1000, 0.001)).toFixed(2)),
    });

    await auditAction({
      user,
      action: 'file_version_uploaded',
      module: 'files',
      description: `New version uploaded for ${parentRecord.originalFileName || parentRecord.id}`,
      metadata: { fileId: parentRecord.id, versionId },
    });

    return {
      file: parentRecord,
      versionId,
      duplicate: false,
      message: 'New file version uploaded',
    };
  }

  const duplicate = await findDuplicate(metadata);
  if (duplicate && body.allowDuplicate !== 'true') {
    return {
      duplicate: true,
      existingFile: duplicate,
      message: 'Duplicate file detected',
    };
  }

  const fileId = await createFileRecord(metadata);
  await syncFileDepartments(fileId, targetDepartmentIds);
  const versionId = await createFileVersion(fileId, metadata);
  const fileRecord = await findFileById(fileId);
  performanceMetricsService.recordUpload({
    fileSize: file.size,
    durationMs: Date.now() - startedAt,
    speedMbps: Number(((file.size / 1024 / 1024) / Math.max((Date.now() - startedAt) / 1000, 0.001)).toFixed(2)),
  });
  await auditAction({
    user,
    action: 'file_uploaded',
    module: 'files',
    description: `File ${fileRecord.originalFileName || fileRecord.id} uploaded`,
    metadata: { fileId: fileRecord.id, versionId },
  });

  return {
    file: fileRecord,
    versionId,
    duplicate: false,
    message: 'File uploaded',
  };
}

export async function uploadMultipleManagedFiles(user, files = [], body = {}) {
  ensureUploadAllowed(user);
  const uploaded = [];

  for (const file of files) {
    uploaded.push(await uploadManagedFile(user, file, body));
  }

  return { uploaded };
}

export async function getFiles(user, filters) {
  return listFiles(user, filters);
}

export async function getFile(user, id) {
  const file = await findFileById(Number(id));
  if (!(await canAccessFileRecord(user, file, 'read'))) {
    throw new AppError('File not found or access denied', 404);
  }
  return file;
}

export async function updateFile(user, id, payload) {
  const file = await getFile(user, id);
  ensureManageAllowed(user, file);
  const shouldUpdateLearningScope = payload.departmentId || payload.curriculumId || payload.courseId;
  const learningScope = shouldUpdateLearningScope ? await resolveLearningScope(user, payload) : {};
  const scopedPayload = { ...payload, ...learningScope };
  const nextAudience = scopedPayload.audience || file.audience;
  const shouldUpdateDepartmentScope = shouldUpdateLearningScope || payload.audience !== undefined || payload.departmentIds !== undefined;
  const targetDepartmentIds = shouldUpdateDepartmentScope
    ? await resolveFileTargetDepartments(user, {
      ...scopedPayload,
      audience: nextAudience,
    })
    : null;
  await updateFileRecord(file.id, scopedPayload);
  if (targetDepartmentIds) {
    await syncFileDepartments(file.id, targetDepartmentIds);
  } else if (scopedPayload.audience && ![ROLES.STUDENT, ROLES.TEACHER].includes(scopedPayload.audience)) {
    await syncFileDepartments(file.id, []);
  }
  const updated = await findFileById(file.id);
  await auditAction({
    user,
    action: 'file_updated',
    module: 'files',
    description: `File ${updated.originalFileName || updated.id} updated`,
    metadata: { fileId: updated.id },
  });
  return updated;
}

export async function removeFile(user, id) {
  const file = await getFile(user, id);
  ensureManageAllowed(user, file);
  await deleteFileRecord(file.id);
  await auditAction({
    user,
    action: 'file_archived',
    module: 'files',
    description: `File ${file.originalFileName || file.id} archived`,
    metadata: { fileId: file.id },
  });
  return { deleted: true };
}

export async function getDownloadStream(user, id, requestMeta) {
  const startedAt = Date.now();
  const file = await getFile(user, id);
  const provider = getStorageProvider();
  const exists = await provider.exists(file.filePath);
  if (!exists) throw new AppError('File is missing from storage', 404);

  await recordDownload({
    fileId: file.id,
    userId: getUserId(user),
    ipAddress: requestMeta.ipAddress,
    deviceInfo: requestMeta.deviceInfo,
  });
  performanceMetricsService.recordDownload({
    fileSize: file.fileSize,
    durationMs: Date.now() - startedAt,
    speedMbps: Number(((file.fileSize / 1024 / 1024) / Math.max((Date.now() - startedAt) / 1000, 0.001)).toFixed(2)),
  });

  return {
    file,
    stream: provider.createReadStream(file.filePath),
    extension: getFileExtension(file.originalFileName),
  };
}

export async function getPreviewStream(user, id, requestMeta) {
  const file = await getFile(user, id);
  const previewableTypes = ['pdf', 'images', 'videos', 'documents'];
  if (!previewableTypes.includes(file.fileType)) {
    throw new AppError('Preview is not available for this file type yet', 400);
  }

  const provider = getStorageProvider();
  const exists = await provider.exists(file.filePath);
  if (!exists) throw new AppError('File is missing from storage', 404);

  await recordPreview({
    fileId: file.id,
    userId: getUserId(user),
    ipAddress: requestMeta.ipAddress,
    deviceInfo: requestMeta.deviceInfo,
  });

  return {
    file,
    stream: provider.createReadStream(file.filePath),
  };
}

export async function getVersionHistory(user, id) {
  const file = await getFile(user, id);
  return { file, versions: await listFileVersions(file.id) };
}

export async function restoreFileVersion(user, versionId) {
  const fileId = await findFileIdByVersion(Number(versionId));
  if (!fileId) throw new AppError('File version not found', 404);
  const file = await getFile(user, fileId);
  ensureManageAllowed(user, file);
  await restoreVersion(Number(versionId));
  const restored = await findFileById(file.id);
  await auditAction({
    user,
    action: 'file_version_restored',
    module: 'files',
    description: `File ${restored.originalFileName || restored.id} version restored`,
    metadata: { fileId: restored.id, versionId: Number(versionId) },
  });
  return restored;
}

export async function getFileStatistics(user) {
  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER].includes(user.role)) {
    throw new AppError('You do not have permission to view storage statistics', 403);
  }

  return getStorageStatistics(user, getStorageProvider().name);
}
