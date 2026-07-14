import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import {
  clearSearchHistory,
  deleteSavedSearch,
  getSearchAnalytics,
  listPopularSearches,
  listSavedSearches,
  listSearchHistory,
  recordSearch,
  runRoleSearch,
  saveSearch,
  updateSavedSearch,
} from '../repositories/searchRepository.js';

function highlight(text = '', term = '') {
  if (!term) return text;
  return String(text).replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>');
}

function groupResults(results, term) {
  return results.reduce((groups, item) => {
    const category = item.category || 'other';
    groups[category] ||= [];
    groups[category].push({
      ...item,
      highlightedTitle: highlight(item.title, term),
      highlightedDescription: highlight(item.description || '', term),
    });
    return groups;
  }, {});
}

export async function search(user, query, deviceInfo) {
  const term = String(query.q || '').trim();
  if (term.length < 2) {
    return { query: term, total: 0, groups: {}, results: [] };
  }
  const results = await runRoleSearch(user, query);
  const sorted = [...results].sort((a, b) => {
    if (query.sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (query.sort === 'az') return String(a.title).localeCompare(String(b.title));
    if (query.sort === 'za') return String(b.title).localeCompare(String(a.title));
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const paginated = sorted.slice((page - 1) * limit, page * limit);

  await recordSearch({
    user,
    term,
    category: query.category,
    filters: query,
    resultCount: sorted.length,
    deviceInfo,
  });

  return {
    query: term,
    total: sorted.length,
    page,
    limit,
    groups: groupResults(paginated, term),
    results: paginated,
  };
}

export async function suggestions(user, query) {
  const term = String(query.q || '').trim();
  const [popular, history] = await Promise.all([
    listPopularSearches(),
    listSearchHistory(user.id),
  ]);
  const instant = term.length >= 2 ? (await runRoleSearch(user, { q: term, limit: 8 })).slice(0, 8) : [];

  return {
    suggestions: instant.map((item) => ({
      title: item.title,
      category: item.category,
      actionUrl: item.actionUrl,
    })),
    recentSearches: history.slice(0, 8),
    popularSearches: popular,
  };
}

export const getHistory = (user) => listSearchHistory(user.id);
export const clearHistory = (user) => clearSearchHistory(user.id);
export const getSaved = (user) => listSavedSearches(user.id);

export async function createSaved(user, payload) {
  const id = await saveSearch({
    userId: user.id,
    name: payload.name,
    term: payload.searchTerm,
    filters: payload.filters,
    isPinned: payload.isPinned,
  });
  return { id };
}

export async function editSaved(user, id, payload) {
  const updated = await updateSavedSearch({ userId: user.id, id, payload });
  if (!updated) throw new AppError('Saved search not found', 404);
  return { updated: true };
}

export async function removeSaved(user, id) {
  const deleted = await deleteSavedSearch({ userId: user.id, id });
  if (!deleted) throw new AppError('Saved search not found', 404);
  return { deleted: true };
}

export async function analytics(user) {
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Only Super Admin can access search analytics', 403);
  }
  return getSearchAnalytics();
}
