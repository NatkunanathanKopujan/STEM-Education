import { AppError } from '../utils/appError.js';
import {
  clearDefaultTimezones,
  createTimezoneRecord,
  deleteTimezoneRecord,
  findDefaultTimezone,
  findFallbackTimezone,
  findTimezoneById,
  findTimezoneByName,
  listTimezones,
  setDefaultTimezone,
  updateTimezoneRecord,
  withTimezoneTransaction,
} from '../repositories/timezoneRepository.js';
import { upsertSetting } from '../repositories/settingsRepository.js';
import { auditAction } from './securityService.js';

const DEFAULT_TIMEZONE_SETTING = 'system.timezone';

function normalizePayload(payload, userId) {
  return {
    name: String(payload.name || '').trim(),
    utcOffset: payload.utcOffset ? String(payload.utcOffset).trim() : null,
    status: payload.status || 'active',
    isDefault: Boolean(payload.isDefault),
    description: payload.description ? String(payload.description).trim() : null,
    updatedBy: userId,
  };
}

async function syncDefaultTimezone(connection, userId) {
  const current = await findDefaultTimezone(connection);
  await upsertSetting(
    {
      settingKey: DEFAULT_TIMEZONE_SETTING,
      settingValue: current?.name || '',
      description: 'Timezone used for platform dates.',
      updatedBy: userId,
    },
    connection,
  );
}

export async function getTimezones(filters = {}) {
  return listTimezones(filters);
}

export async function getTimezone(id) {
  const timezone = await findTimezoneById(id);

  if (!timezone) {
    throw new AppError('Timezone not found', 404);
  }

  return timezone;
}

export async function addTimezone(user, payload, req = {}) {
  const normalized = normalizePayload(payload, user.id);

  return withTimezoneTransaction(async (connection) => {
    const existing = await findTimezoneByName(normalized.name, connection);
    if (existing) {
      throw new AppError('Timezone already exists. Use Edit to update the existing record.', 409);
    }

    if (normalized.isDefault) {
      await clearDefaultTimezones(null, connection);
    }

    const id = await createTimezoneRecord(
      {
        ...normalized,
        createdBy: user.id,
      },
      connection,
    );

    if (normalized.isDefault) {
      await syncDefaultTimezone(connection, user.id);
    }

    const timezone = await findTimezoneById(id, connection);
    await auditAction({
      userId: user.id,
      role: user.role,
      action: 'timezone.create',
      module: 'timezones',
      description: `Created timezone ${timezone.name}`,
      ipAddress: req.ip,
      status: 'success',
      metadata: { timezoneId: id },
    });

    return timezone;
  });
}

export async function saveTimezone(user, id, payload, req = {}) {
  const normalized = normalizePayload(payload, user.id);

  return withTimezoneTransaction(async (connection) => {
    const timezone = await findTimezoneById(id, connection);
    if (!timezone) {
      throw new AppError('Timezone not found', 404);
    }

    const duplicate = await findTimezoneByName(normalized.name, connection);
    if (duplicate && Number(duplicate.id) !== Number(id)) {
      throw new AppError('Timezone already exists. Use a different name or edit that record.', 409);
    }

    if (normalized.isDefault) {
      await clearDefaultTimezones(id, connection);
    }

    await updateTimezoneRecord(id, normalized, connection);
    const updated = await findTimezoneById(id, connection);

    if (normalized.isDefault || timezone.isDefault) {
      await syncDefaultTimezone(connection, user.id);
    }

    await auditAction({
      userId: user.id,
      role: user.role,
      action: 'timezone.update',
      module: 'timezones',
      description: `Updated timezone ${updated.name}`,
      ipAddress: req.ip,
      status: 'success',
      metadata: { timezoneId: id },
    });

    return updated;
  });
}

export async function removeTimezone(user, id, req = {}) {
  return withTimezoneTransaction(async (connection) => {
    const timezone = await findTimezoneById(id, connection);
    if (!timezone) {
      throw new AppError('Timezone not found', 404);
    }

    await deleteTimezoneRecord(id, connection);

    if (timezone.isDefault) {
      const fallback = await findFallbackTimezone(connection);
      if (fallback) {
        await setDefaultTimezone(fallback.id, connection);
      }
      await syncDefaultTimezone(connection, user.id);
    }

    await auditAction({
      userId: user.id,
      role: user.role,
      action: 'timezone.delete',
      module: 'timezones',
      description: `Deleted timezone ${timezone.name}`,
      ipAddress: req.ip,
      status: 'success',
      metadata: { timezoneId: id },
    });

    return { deleted: true };
  });
}
