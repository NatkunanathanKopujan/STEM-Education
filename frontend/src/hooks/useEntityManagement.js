import { useCallback, useEffect, useMemo, useState } from 'react';
import { userManagementService } from '../services/userManagementService';

const createUsername = (fullName) =>
  fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');

export const generatePassword = () =>
  `Lms@${Math.random().toString(36).slice(2, 8)}${Math.floor(100 + Math.random() * 900)}`;

export const generateStudentId = () =>
  `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

export function useEntityManagement(initialItems = [], type = null) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(Boolean(type));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isApiBacked = type === 'teacher' || type === 'student' || type === 'curriculum';

  const loadItems = useCallback(async () => {
    if (!isApiBacked) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await userManagementService.list(type);
      setItems(response.users || response.curriculums || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to load ${type}s.`);
    } finally {
      setIsLoading(false);
    }
  }, [isApiBacked, type]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = Object.values(item).join(' ').toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const createLocalItem = (payload) => {
    const initials = (payload.fullName || payload.name || 'NA')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    setItems((current) => [
      { id: Date.now(), createdDate: new Date().toISOString().slice(0, 10), photo: initials, ...payload },
      ...current,
    ]);
  };

  const createItem = async (payload) => {
    if (!isApiBacked) {
      createLocalItem(payload);
      return null;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      const item = await userManagementService.create(type, {
        ...payload,
        username: payload.username || createUsername(payload.fullName),
      });
      setItems((current) => [item, ...current]);
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
    try {
      const item = await userManagementService.update(type, id, payload);
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      return item;
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to update ${type}.`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!isApiBacked) {
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      await userManagementService.remove(type, id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to delete ${type}.`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    items,
    filteredItems,
    isLoading,
    isSaving,
    errorMessage,
    loadItems,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    createItem,
    updateItem,
    deleteItem,
    generateUsername: createUsername,
  };
}
