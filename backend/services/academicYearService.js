import { AppError } from '../utils/appError.js';
import {
  clearCurrentAcademicYears,
  createAcademicYearRecord,
  deleteAcademicYearRecord,
  findFallbackAcademicYear,
  findAcademicYearById,
  findAcademicYearByName,
  findCurrentAcademicYear,
  listAcademicYears,
  setCurrentAcademicYear,
  updateAcademicYearRecord,
  withAcademicYearTransaction,
} from '../repositories/academicYearRepository.js';
import { upsertSetting } from '../repositories/settingsRepository.js';
import { auditAction } from './securityService.js';

const CURRENT_ACADEMIC_YEAR_SETTING = 'academic.year';

function normalizePayload(payload, userId) {
  return {
    name: String(payload.name || '').trim(),
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    status: payload.status || 'upcoming',
    isCurrent: Boolean(payload.isCurrent),
    description: payload.description ? String(payload.description).trim() : null,
    updatedBy: userId,
  };
}

function assertDateOrder(payload) {
  if (!payload.startDate || !payload.endDate) return;

  if (new Date(payload.endDate) < new Date(payload.startDate)) {
    throw new AppError('End date must be on or after the start date', 400);
  }
}

async function syncCurrentAcademicYear(connection, userId) {
  const current = await findCurrentAcademicYear(connection);
  await upsertSetting({
    settingKey: CURRENT_ACADEMIC_YEAR_SETTING,
    settingValue: current?.name || '',
    description: 'Current academic year label.',
    updatedBy: userId,
  }, connection);
}

export async function getAcademicYears(filters = {}) {
  return listAcademicYears(filters);
}

export async function getAcademicYear(id) {
  const academicYear = await findAcademicYearById(id);

  if (!academicYear) {
    throw new AppError('Academic year not found', 404);
  }

  return academicYear;
}

export async function addAcademicYear(user, payload, req = {}) {
  const normalized = normalizePayload(payload, user.id);
  assertDateOrder(normalized);

  return withAcademicYearTransaction(async (connection) => {
    const existing = await findAcademicYearByName(normalized.name, connection);
    if (existing) {
      throw new AppError('Academic year already exists. Use Edit to update the existing record.', 409);
    }

    if (normalized.isCurrent) {
      await clearCurrentAcademicYears(null, connection);
    }

    const id = await createAcademicYearRecord(
      {
        ...normalized,
        createdBy: user.id,
      },
      connection,
    );

    if (normalized.isCurrent) {
      await syncCurrentAcademicYear(connection, user.id);
    }

    const academicYear = await findAcademicYearById(id, connection);
    await auditAction({
      userId: user.id,
      role: user.role,
      action: 'academic_year.create',
      module: 'academic_years',
      description: `Created academic year ${academicYear.name}`,
      ipAddress: req.ip,
      status: 'success',
      metadata: { academicYearId: id },
    });

    return academicYear;
  });
}

export async function saveAcademicYear(user, id, payload, req = {}) {
  const normalized = normalizePayload(payload, user.id);
  assertDateOrder(normalized);

  return withAcademicYearTransaction(async (connection) => {
    const academicYear = await findAcademicYearById(id, connection);
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }

    const duplicate = await findAcademicYearByName(normalized.name, connection);
    if (duplicate && Number(duplicate.id) !== Number(id)) {
      throw new AppError('Academic year already exists. Use a different name or edit that record.', 409);
    }

    if (normalized.isCurrent) {
      await clearCurrentAcademicYears(id, connection);
    }

    await updateAcademicYearRecord(id, normalized, connection);
    const updated = await findAcademicYearById(id, connection);

    if (normalized.isCurrent || academicYear.isCurrent) {
      await syncCurrentAcademicYear(connection, user.id);
    }

    await auditAction({
      userId: user.id,
      role: user.role,
      action: 'academic_year.update',
      module: 'academic_years',
      description: `Updated academic year ${updated.name}`,
      ipAddress: req.ip,
      status: 'success',
      metadata: { academicYearId: id },
    });

    return updated;
  });
}

export async function removeAcademicYear(user, id, req = {}) {
  return withAcademicYearTransaction(async (connection) => {
    const academicYear = await findAcademicYearById(id, connection);
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }

    await deleteAcademicYearRecord(id, connection);

    if (academicYear.isCurrent) {
      const fallback = await findFallbackAcademicYear(connection);
      if (fallback) {
        await setCurrentAcademicYear(fallback.id, connection);
      }
      await syncCurrentAcademicYear(connection, user.id);
    }

    await auditAction({
      userId: user.id,
      role: user.role,
      action: 'academic_year.delete',
      module: 'academic_years',
      description: `Deleted academic year ${academicYear.name}`,
      ipAddress: req.ip,
      status: 'success',
      metadata: { academicYearId: id },
    });

    return { deleted: true };
  });
}
