import { useCallback, useEffect, useState } from 'react';
import { userManagementService } from '../services/userManagementService';

const createUsername = (fullName) =>
  fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');

export const generatePassword = () =>
  `Lms@${Math.random().toString(36).slice(2, 8)}${Math.floor(100 + Math.random() * 900)}`;

export const generateStudentId = () =>
  `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

function notifyDataChanged(type, action) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('lms:data-changed', { detail: { type, action } }));
}

export function useEntityManagement(initialItems = [], type = null) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(Boolean(type));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(initialItems.length);
  const [sortField, setSortField] = useState('createdDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const isApiBacked = type === 'teacher' || type === 'student' || type === 'curriculum';

  const fetchItems = useCallback(async (overrides = {}) => {
    if (!isApiBacked) {
      setItems([]);
      setTotal(0);
      return;
    }

    const nextQuery = overrides.query ?? query;
    const nextStatusFilter = overrides.statusFilter ?? statusFilter;
    const nextPage = overrides.page ?? page;
    const nextSortField = overrides.sortField ?? sortField;
    const nextSortDirection = overrides.sortDirection ?? sortDirection;

    const response = await userManagementService.list(type, {
      search: nextQuery,
      status: nextStatusFilter === 'All' ? '' : nextStatusFilter,
      page: nextPage,
      limit,
      sort: nextSortField,
      direction: nextSortDirection,
    });

    const records = response.users || response.curriculums || [];
    setItems(records);
    setTotal(Number(response.total || records.length || 0));
    setPage(Number(response.page || nextPage || 1));
    return response;
  }, [isApiBacked, limit, page, query, sortDirection, sortField, statusFilter, type]);

  const loadItems = useCallback(async (overrides = {}) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await fetchItems(overrides);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to load ${type}s.`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, type]);

  useEffect(() => {
    setPage(1);
  }, [query, sortDirection, sortField, statusFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = async (payload) => {
    if (!isApiBacked) {
      return null;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const item = await userManagementService.create(type, {
        ...payload,
        ...(type === 'teacher' || type === 'student'
          ? { username: payload.username || createUsername(payload.fullName) }
          : {}),
      });
      await fetchItems({ page: 1 });
      setSuccessMessage(`${type === 'curriculum' ? 'Curriculum' : type === 'teacher' ? 'Teacher' : 'Student'} created successfully.`);
      notifyDataChanged(type, 'created');
      return item;
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to create ${type}.`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = async (id, payload) => {
    if (!isApiBacked) {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, ...payload } : item)));
      return null;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const item = await userManagementService.update(type, id, payload);
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      setSuccessMessage(`${type === 'curriculum' ? 'Curriculum' : type === 'teacher' ? 'Teacher' : 'Student'} updated successfully.`);
      notifyDataChanged(type, 'updated');
      return item;
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to update ${type}.`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const viewItem = async (id) => {
    if (!isApiBacked) {
      return items.find((item) => item.id === id) || null;
    }

    setErrorMessage('');
    try {
      return await userManagementService.get(type, id);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to load ${type} details.`);
      throw error;
    }
  };

  const deleteItem = async (id) => {
    if (!isApiBacked) {
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await userManagementService.remove(type, id);
      await fetchItems();
      setSuccessMessage(`${type === 'curriculum' ? 'Curriculum' : type === 'teacher' ? 'Teacher' : 'Student'} deleted successfully.`);
      notifyDataChanged(type, 'deleted');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to delete ${type}.`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    items,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    loadItems,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
    limit,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    setPage,
    viewItem,
    createItem,
    updateItem,
    deleteItem,
    generateUsername: createUsername,
  };
}
