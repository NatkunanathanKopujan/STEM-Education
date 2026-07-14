import {
  analytics,
  clearHistory,
  createSaved,
  editSaved,
  getHistory,
  getSaved,
  removeSaved,
  search,
  suggestions,
} from '../services/searchService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function searchController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await search(req.user, req.query, { userAgent: req.get('user-agent'), ipAddress: req.ip }),
      'Search completed',
    );
  } catch (error) {
    return next(error);
  }
}

export async function suggestionsController(req, res, next) {
  try {
    return sendSuccess(res, await suggestions(req.user, req.query), 'Search suggestions fetched');
  } catch (error) {
    return next(error);
  }
}

export async function historyController(req, res, next) {
  try {
    return sendSuccess(res, { history: await getHistory(req.user) }, 'Search history fetched');
  } catch (error) {
    return next(error);
  }
}

export async function clearHistoryController(req, res, next) {
  try {
    await clearHistory(req.user);
    return sendSuccess(res, { cleared: true }, 'Search history cleared');
  } catch (error) {
    return next(error);
  }
}

export async function saveSearchController(req, res, next) {
  try {
    return sendSuccess(res, await createSaved(req.user, req.body), 'Search saved', 201);
  } catch (error) {
    return next(error);
  }
}

export async function savedSearchesController(req, res, next) {
  try {
    return sendSuccess(res, { savedSearches: await getSaved(req.user) }, 'Saved searches fetched');
  } catch (error) {
    return next(error);
  }
}

export async function updateSavedSearchController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await editSaved(req.user, Number(req.params.id), req.body),
      'Saved search updated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function deleteSavedSearchController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await removeSaved(req.user, Number(req.params.id)),
      'Saved search deleted',
    );
  } catch (error) {
    return next(error);
  }
}

export async function analyticsController(req, res, next) {
  try {
    return sendSuccess(res, await analytics(req.user), 'Search analytics fetched');
  } catch (error) {
    return next(error);
  }
}
