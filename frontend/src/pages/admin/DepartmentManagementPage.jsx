import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiPower, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox, Textarea } from '../../components/ui/FormControls';
import { departmentService } from '../../services/departmentService';

const initialForm = {
  name: '',
  description: '',
  status: 'Active',
};

export function DepartmentManagementPage() {
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDepartments = useCallback(async (overrides = {}) => {
    const nextPage = overrides.page ?? 1;
    setIsLoading(true);
    setError('');
    try {
      const response = await departmentService.list({
        search: overrides.search ?? query,
        status: overrides.status ?? statusFilter,
        page: nextPage,
        limit: 10,
        sort: 'name',
        direction: 'asc',
      });
      setDepartments(response.departments || []);
      setTotalPages(Math.max(1, Math.ceil(Number(response.total || 0) / Number(response.limit || 10))));
      setPage(Number(response.page || nextPage));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load departments.');
    } finally {
      setIsLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    loadDepartments({ page: 1 });
  }, [loadDepartments]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (department) => {
    setEditing(department);
    setForm({
      name: department.name || '',
      description: department.description || '',
      status: department.status || 'Active',
    });
    setModalOpen(true);
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      if (editing) {
        await departmentService.update(editing.id, form);
        setMessage('Department updated successfully.');
      } else {
        await departmentService.create(form);
        setMessage('Department created successfully.');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(initialForm);
      window.dispatchEvent(new CustomEvent('lms:data-changed', { detail: { type: 'department', action: editing ? 'updated' : 'created' } }));
      await loadDepartments({ page: 1 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to save department.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDepartment = async (department) => {
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      await departmentService.update(department.id, {
        status: department.status === 'Active' ? 'Inactive' : 'Active',
      });
      setMessage('Department status updated.');
      window.dispatchEvent(new CustomEvent('lms:data-changed', { detail: { type: 'department', action: 'updated' } }));
      await loadDepartments();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update department status.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDepartment = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      await departmentService.remove(deleteTarget.id);
      setMessage('Department deleted successfully.');
      setDeleteTarget(null);
      window.dispatchEvent(new CustomEvent('lms:data-changed', { detail: { type: 'department', action: 'deleted' } }));
      await loadDepartments({ page: 1 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to delete department.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    loadDepartments({ page: 1 });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Department Management"
        description="Create, update, activate, deactivate, and manage teacher departments from live database records."
        actionLabel="Add Department"
        onAction={openCreate}
      />
      <Card className="p-5">
        <ErrorAlert message={error} />
        <SuccessAlert message={message} />
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
          <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search departments" />
          <SelectBox
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <Button variant="secondary" disabled={isLoading} onClick={applyFilters}>
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button disabled={isSaving} onClick={openCreate}>Add Department</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                {['Department', 'Description', 'Status', 'Updated', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {!isLoading && departments.map((department) => (
                <tr key={department.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-ink">{department.name}</td>
                  <td className="px-4 py-3 text-muted">{department.description || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={department.status} /></td>
                  <td className="px-4 py-3 text-muted">{department.updatedAt ? new Date(department.updatedAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" className="px-2" disabled={isSaving} onClick={() => openEdit(department)} aria-label="Edit department"><FiEdit2 /></Button>
                      <Button variant="ghost" className="px-2" disabled={isSaving} onClick={() => toggleDepartment(department)} aria-label="Toggle department status"><FiPower /></Button>
                      <Button variant="ghost" className="px-2 text-red-600" disabled={isSaving} onClick={() => setDeleteTarget(department)} aria-label="Delete department"><FiTrash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !departments.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-muted" colSpan={5}>No departments found.</td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-muted" colSpan={5}>Loading departments...</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={(nextPage) => loadDepartments({ page: nextPage })} />
        </div>
      </Card>
      <Modal open={modalOpen} title={editing ? 'Edit Department' : 'Add Department'} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={saveDepartment}>
          <Input
            label="Department Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <SelectBox
            label="Status"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{editing ? 'Save Changes' : 'Create Department'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete department"
        message={`Delete department "${deleteTarget?.name}"? Assigned teachers will have their department cleared.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteDepartment}
      />
    </div>
  );
}
