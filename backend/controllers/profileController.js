import {
  changeMyPassword,
  deleteProfilePhoto,
  getLoginHistory,
  getMyProfile,
  getProfilePreferences,
  getSessions,
  terminateAllSessions,
  terminateSession,
  updateMyProfile,
  updateProfilePreferences,
  uploadProfilePhoto,
} from '../services/profileService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function getProfileController(req, res, next) {
  try {
    return sendSuccess(res, await getMyProfile(req.user), 'Profile fetched');
  } catch (error) {
    return next(error);
  }
}

export async function updateProfileController(req, res, next) {
  try {
    return sendSuccess(res, await updateMyProfile(req.user, req.body, req.ip), 'Profile updated');
  } catch (error) {
    return next(error);
  }
}

export async function uploadPhotoController(req, res, next) {
  try {
    return sendSuccess(res, await uploadProfilePhoto(req.user, req.file, req.ip), 'Profile photo uploaded');
  } catch (error) {
    return next(error);
  }
}

export async function deletePhotoController(req, res, next) {
  try {
    return sendSuccess(res, await deleteProfilePhoto(req.user, req.ip), 'Profile photo removed');
  } catch (error) {
    return next(error);
  }
}

export async function changePasswordController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await changeMyPassword(req.user, req.body, req.ip),
      'Password changed successfully',
    );
  } catch (error) {
    return next(error);
  }
}

export async function loginHistoryController(req, res, next) {
  try {
    return sendSuccess(res, await getLoginHistory(req.user, req.query), 'Login history fetched');
  } catch (error) {
    return next(error);
  }
}

export async function sessionsController(req, res, next) {
  try {
    return sendSuccess(res, await getSessions(req.user), 'Connected sessions fetched');
  } catch (error) {
    return next(error);
  }
}

export async function deleteSessionController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await terminateSession(req.user, Number(req.params.id), req.ip),
      'Session terminated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function deleteSessionsController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await terminateAllSessions(req.user, req.body, req.ip),
      'Sessions terminated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function preferencesController(req, res, next) {
  try {
    return sendSuccess(res, await getProfilePreferences(req.user), 'Profile preferences fetched');
  } catch (error) {
    return next(error);
  }
}

export async function updatePreferencesController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await updateProfilePreferences(req.user, req.body, req.ip),
      'Profile preferences updated',
    );
  } catch (error) {
    return next(error);
  }
}
