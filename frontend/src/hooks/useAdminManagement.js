import { useCallback, useEffect, useMemo, useState } from 'react';
import { superAdminService } from '../services/superAdminService';

const createUsername = (fullName) =>
  fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

export function generateStrongPassword() {
  return `Lms@${Math.random().toString(36).slice(2, 8)}${Math.floor(100 + Math.random() * 900)}`;
}

export function useAdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await superAdminService.getAdmins();
      setAdmins(response.admins || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load admins.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const filteredAdmins = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesQuery = [admin.fullName, admin.username, admin.email, admin.department]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
      const matchesStatus = statusFilter === 'All' || admin.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [admins, query, statusFilter]);

  const createAdmin = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const admin = await superAdminService.createAdmin({
        ...payload,
        username: payload.username || createUsername(payload.fullName),
      });
      setAdmins((items) => [admin, ...items]);
      return admin;
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to create admin.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAdmin = async (id, payload) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const admin = await superAdminService.updateAdmin(id, payload);
      setAdmins((items) => items.map((item) => (item.id === id ? admin : item)));
      return admin;
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to update admin.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAdmin = async (id) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await superAdminService.deleteAdmin(id);
      setAdmins((items) => items.filter((admin) => admin.id !== id));
      setSelectedIds((items) => items.filter((item) => item !== id));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to delete admin.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const bulkUpdateStatus = async (status) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const selectedAdmins = admins.filter((admin) => selectedIds.includes(admin.id));
      const updatedAdmins = await Promise.all(
        selectedAdmins.map((admin) => superAdminService.updateAdmin(admin.id, { ...admin, status })),
      );
      setAdmins((items) =>
        items.map((admin) => updatedAdmins.find((updated) => updated.id === admin.id) || admin),
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to update selected admins.');
      throw error;
    } finally {
      setIsSaving(false);
    }
    setSelectedIds([]);
  };

  const bulkDelete = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await Promise.all(selectedIds.map((id) => superAdminService.deleteAdmin(id)));
      setAdmins((items) => items.filter((admin) => !selectedIds.includes(admin.id)));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to delete selected admins.');
      throw error;
    } finally {
      setIsSaving(false);
    }
    setSelectedIds([]);
  };

  const toggleSelected = (id) => {
    setSelectedIds((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? filteredAdmins.map((admin) => admin.id) : []);
  };

  return {
    admins,
    filteredAdmins,
    isLoading,
    isSaving,
    errorMessage,
    loadAdmins,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    bulkUpdateStatus,
    bulkDelete,
    toggleSelected,
    toggleAll,
    generateUsername: createUsername,
  };
}
