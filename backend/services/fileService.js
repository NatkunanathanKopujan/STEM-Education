import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { getFileCategory, getFileExtension } from '../utils/fileHelper.js';
import {
  canAccessFile,
  createFileRecord,
  createFileVersion,
  deleteFileRecord,
  findDuplicate,
  findFileIdByVersion,
  findFileById,
  getStorageStatistics,
  listFiles,
  listFileVersions,
  recordDownload,
  recordPreview,
  restoreVersion,
  updateFileRecord,
} from '../repositories/fileRepository.js';
import { getStorageProvider } from './storageProviderService.js';
import { performanceMetricsService } from './performanceMetricsService.js';

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
    weekNo: body.weekNo ? Number(body.weekNo) : null,
    topic: body.topic,
    description: body.description,
    versionNote: body.versionNote,
    visibility,
    status,
    tags: body.tags,
    logicalFolder: buildLogicalFolder({ ...body, uploadedRole }),
    storageProvider: getStorageProvider().name,
  };
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
  const allowedStatus = !body.status || body.status === 'active';
  if (!allowedVisibility || !allowedStatus) {
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

  const metadata = normalizeMetadata(user, file, body);
  metadata.checksum = await calculateChecksum(file.path);

  if (body.parentFileId) {
    const parent = await findFileById(Number(body.parentFileId));
    ensureManageAllowed(user, parent);
    const versionId = await createFileVersion(parent.id, metadata);
    performanceMetricsService.recordUpload({
      fileSize: file.size,
      durationMs: Date.now() - startedAt,
      speedMbps: Number(((file.size / 1024 / 1024) / Math.max((Date.now() - startedAt) / 1000, 0.001)).toFixed(2)),
    });

    return {
      file: await findFileById(parent.id),
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
  const versionId = await createFileVersion(fileId, metadata);
  performanceMetricsService.recordUpload({
    fileSize: file.size,
    durationMs: Date.now() - startedAt,
    speedMbps: Number(((file.size / 1024 / 1024) / Math.max((Date.now() - startedAt) / 1000, 0.001)).toFixed(2)),
  });

  return {
    file: await findFileById(fileId),
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
  if (!canAccessFile(user, file, 'read')) {
    throw new AppError('File not found or access denied', 404);
  }
  return file;
}

export async function updateFile(user, id, payload) {
  const file = await getFile(user, id);
  ensureManageAllowed(user, file);
  await updateFileRecord(file.id, payload);
  return findFileById(file.id);
}

export async function removeFile(user, id) {
  const file = await getFile(user, id);
  ensureManageAllowed(user, file);
  await deleteFileRecord(file.id);
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
  return findFileById(file.id);
}

export async function getFileStatistics(user) {
  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER].includes(user.role)) {
    throw new AppError('You do not have permission to view storage statistics', 403);
  }

  return getStorageStatistics(user, getStorageProvider().name);
}
