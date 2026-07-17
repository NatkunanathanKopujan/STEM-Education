import { AppError } from '../utils/appError.js';
import {
  createSetting,
  deleteSetting,
  findSettingByKey,
  listSettings,
  updateSetting,
  upsertSetting,
} from '../repositories/settingsRepository.js';
import { auditAction } from './securityService.js';

function isBlankLogoSetting(setting) {
  return setting.settingKey === 'branding.logoUrl' && !String(setting.settingValue || '').trim();
}

export function getSettings(filters = {}) {
  return listSettings(filters);
}

export async function getSetting(settingKey) {
  const setting = await findSettingByKey(settingKey);

  if (!setting) {
    throw new AppError('Setting not found', 404);
  }

  return setting;
}

export async function addSetting(user, payload, req = {}) {
  const existing = await findSettingByKey(payload.settingKey);

  if (existing) {
    throw new AppError('Setting key already exists', 409);
  }

  const id = await createSetting({
    ...payload,
    updatedBy: user.id,
  });

  await auditAction({
    userId: user.id,
    role: user.role,
    action: 'settings.create',
    module: 'settings',
    description: `Created setting ${payload.settingKey}`,
    ipAddress: req.ip,
    status: 'success',
    metadata: { settingKey: payload.settingKey },
  });

  return { id, ...(await getSetting(payload.settingKey)) };
}

export async function saveSetting(user, settingKey, payload, req = {}) {
  if (isBlankLogoSetting({ settingKey, settingValue: payload.settingValue })) {
    throw new AppError('Use Reset to remove the system logo instead of saving an empty logo URL', 400);
  }

  const updated = await updateSetting(settingKey, {
    settingValue: payload.settingValue,
    description: payload.description,
    updatedBy: user.id,
  });

  if (!updated) {
    throw new AppError('Setting not found', 404);
  }

  await auditAction({
    userId: user.id,
    role: user.role,
    action: 'settings.update',
    module: 'settings',
    description: `Updated setting ${settingKey}`,
    ipAddress: req.ip,
    status: 'success',
    metadata: { settingKey },
  });

  return getSetting(settingKey);
}

export async function saveSettings(user, payload, req = {}) {
  const settingsPayload = payload.settings.filter((setting) => !isBlankLogoSetting(setting));
  const settings = await Promise.all(
    settingsPayload.map((setting) =>
      upsertSetting({
        ...setting,
        updatedBy: user.id,
      }),
    ),
  );

  await auditAction({
    userId: user.id,
    role: user.role,
    action: 'settings.bulk_upsert',
    module: 'settings',
    description: `Saved ${settings.length} system settings`,
    ipAddress: req.ip,
    status: 'success',
    metadata: { settingKeys: settings.map((setting) => setting.settingKey) },
  });

  return { settings };
}

export async function removeSetting(user, settingKey, req = {}) {
  const deleted = await deleteSetting(settingKey);

  if (!deleted) {
    throw new AppError('Setting not found', 404);
  }

  await auditAction({
    userId: user.id,
    role: user.role,
    action: 'settings.delete',
    module: 'settings',
    description: `Deleted setting ${settingKey}`,
    ipAddress: req.ip,
    status: 'success',
    metadata: { settingKey },
  });

  return { deleted: true };
}

export async function uploadSystemLogo(user, file, req = {}) {
  if (!file) {
    throw new AppError('Logo image is required', 400);
  }

  const logoUrl = `/uploads/settings/${file.filename}`;
  const setting = await upsertSetting({
    settingKey: 'branding.logoUrl',
    settingValue: logoUrl,
    description: 'Public logo URL or uploaded system logo path.',
    updatedBy: user.id,
  });

  await auditAction({
    userId: user.id,
    role: user.role,
    action: 'settings.logo_upload',
    module: 'settings',
    description: 'Uploaded system logo',
    ipAddress: req.ip,
    status: 'success',
    metadata: { settingKey: 'branding.logoUrl', logoUrl },
  });

  return { logoUrl, setting };
}
