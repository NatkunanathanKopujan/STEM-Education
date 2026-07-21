import { useCallback, useEffect, useState } from 'react';
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
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchAdmins = useCallback(async (overrides = {}) => {
    const response = await superAdminService.getAdmins({
      search: (overrides.query ?? query).trim(),
      status: (overrides.statusFilter ?? statusFilter) === 'All' ? '' : overrides.statusFilter ?? statusFilter,
      page: overrides.page ?? page,
      limit,
    });
    setAdmins(response.admins || []);
    setTotal(response.total || 0);
    return response;
  }, [limit, page, query, statusFilter]);

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await fetchAdmins();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load admins.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAdmins]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [query, statusFilter]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const createAdmin = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const admin = await superAdminService.createAdmin({
        ...payload,
        username: payload.username || createUsername(payload.fullName),
      });
      setPage(1);
      await fetchAdmins({ page: 1 });
      setSuccessMessage('Admin account created successfully.');
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
    setSuccessMessage('');
    try {
      const admin = await superAdminService.updateAdmin(id, payload);
      setAdmins((items) => items.map((item) => (item.id === id ? admin : item)));
      setSuccessMessage('Admin account updated successfully.');
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
    setSuccessMessage('');
    try {
      await superAdminService.deleteAdmin(id);
      await fetchAdmins();
      setSelectedIds((items) => items.filter((item) => item !== id));
      setSuccessMessage('Admin account deleted successfully.');
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
    setSuccessMessage('');
    try {
      const selectedAdmins = admins.filter((admin) => selectedIds.includes(admin.id));
      const updatedAdmins = await Promise.all(
        selectedAdmins.map((admin) => superAdminService.updateAdmin(admin.id, { ...admin, status })),
      );
      setAdmins((items) =>
        items.map((admin) => updatedAdmins.find((updated) => updated.id === admin.id) || admin),
      );
      await fetchAdmins();
      setSelectedIds([]);
      setSuccessMessage(`Selected admins ${status.toLowerCase()} successfully.`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to update selected admins.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const bulkDelete = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await Promise.all(selectedIds.map((id) => superAdminService.deleteAdmin(id)));
      await fetchAdmins();
      setSelectedIds([]);
      setSuccessMessage('Selected admin accounts deleted successfully.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to delete selected admins.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? admins.map((admin) => admin.id) : []);
  };

  return {
    admins,
    total,
    page,
    setPage,
    limit,
    totalPages,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
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
