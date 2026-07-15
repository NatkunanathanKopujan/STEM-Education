import { useState } from 'react';
import { FiEdit2, FiEye, FiPower, FiTrash2 } from 'react-icons/fi';
import { AdminForm } from '../../components/super-admin/AdminForm';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button, DangerButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/Alerts';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { useAdminManagement } from '../../hooks/useAdminManagement';

export function AdminManagementPage() {
  const adminState = useAdminManagement();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [deleteAdmin, setDeleteAdmin] = useState(null);

  const openCreate = () => {
    setEditingAdmin(null);
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingAdmin) {
        await adminState.updateAdmin(editingAdmin.id, values);
      } else {
        await adminState.createAdmin(values);
      }
      setModalOpen(false);
      setEditingAdmin(null);
    } catch {
      // The hook owns the user-facing error message.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        description="Create, search, view, edit, activate, deactivate, and delete LMS admin accounts."
        actionLabel="Create Admin"
        onAction={openCreate}
      />
      <Card className="p-5">
        <ErrorAlert message={adminState.errorMessage} />
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
          <SearchBar
            value={adminState.query}
            onChange={(event) => adminState.setQuery(event.target.value)}
            placeholder="Search admins by name, username, email, or department"
          />
          <SelectBox
            value={adminState.statusFilter}
            onChange={(event) => adminState.setStatusFilter(event.target.value)}
            options={[
              { label: 'All Status', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <SecondaryButton disabled={adminState.isSaving} onClick={() => adminState.bulkUpdateStatus('Active')}>Bulk Activate</SecondaryButton>
            <SecondaryButton disabled={adminState.isSaving} onClick={() => adminState.bulkUpdateStatus('Inactive')}>Bulk Deactivate</SecondaryButton>
            <DangerButton disabled={adminState.isSaving} onClick={adminState.bulkDelete}>Bulk Delete</DangerButton>
          </div>
        </div>
      </Card>
      {adminState.isLoading ? <Loader label="Loading admins" /> : null}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    onChange={(event) => adminState.toggleAll(event.target.checked)}
                    aria-label="Select all admins"
                  />
                </th>
                {['Profile', 'Name', 'Username', 'Email', 'Phone', 'Department', 'Status', 'Created Date', 'Actions'].map(
                  (heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {!adminState.isLoading && adminState.filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-orange-50/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={adminState.selectedIds.includes(admin.id)}
                      onChange={() => adminState.toggleSelected(admin.id)}
                      aria-label={`Select ${admin.fullName}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-sm font-bold text-primary">
                      {admin.photo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{admin.fullName}</td>
                  <td className="px-4 py-3 text-muted">{admin.username}</td>
                  <td className="px-4 py-3 text-muted">{admin.email}</td>
                  <td className="px-4 py-3 text-muted">{admin.phone}</td>
                  <td className="px-4 py-3 text-muted">{admin.department}</td>
                  <td className="px-4 py-3"><StatusBadge status={admin.status} /></td>
                  <td className="px-4 py-3 text-muted">{admin.createdDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        disabled={adminState.isSaving}
                        variant="ghost"
                        className="px-2"
                        aria-label={`View ${admin.fullName}`}
                        onClick={() => setViewingAdmin(admin)}
                      >
                        <FiEye />
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2"
                        aria-label="Edit admin"
                        disabled={adminState.isSaving}
                        onClick={() => {
                          setEditingAdmin(admin);
                          setModalOpen(true);
                        }}
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2"
                        aria-label="Toggle admin status"
                        disabled={adminState.isSaving}
                        onClick={() =>
                          adminState.updateAdmin(admin.id, {
                            status: admin.status === 'Active' ? 'Inactive' : 'Active',
                          })
                        }
                      >
                        <FiPower />
                      </Button>
                      <Button disabled={adminState.isSaving} variant="ghost" className="px-2 text-red-600" onClick={() => setDeleteAdmin(admin)} aria-label="Delete admin">
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!adminState.isLoading && !adminState.filteredAdmins.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-muted" colSpan={9}>
                    No admins found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-4">
          <Pagination page={1} totalPages={1} />
        </div>
      </Card>
      <Modal
        open={modalOpen}
        title={editingAdmin ? 'Edit Admin' : 'Create Admin'}
        onClose={() => setModalOpen(false)}
      >
        <AdminForm
          admin={editingAdmin}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          generateUsername={adminState.generateUsername}
        />
      </Modal>
      <Modal
        open={Boolean(viewingAdmin)}
        title="Admin Details"
        onClose={() => setViewingAdmin(null)}
      >
        {viewingAdmin ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-xl bg-orange-50 text-lg font-bold text-primary">
                {viewingAdmin.photo}
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink">{viewingAdmin.fullName}</h3>
                <p className="text-sm text-muted">{viewingAdmin.username}</p>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Email', viewingAdmin.email],
                ['Phone', viewingAdmin.phone || '-'],
                ['Department', viewingAdmin.department || '-'],
                ['Status', viewingAdmin.status],
                ['Created Date', viewingAdmin.createdDate || '-'],
                ['Role', 'Admin'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-page p-3">
                  <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
                  <dd className="mt-1 font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-end">
              <SecondaryButton onClick={() => setViewingAdmin(null)}>Close</SecondaryButton>
            </div>
          </div>
        ) : null}
      </Modal>
      <ConfirmationDialog
        open={Boolean(deleteAdmin)}
        title="Delete admin"
        message={`Are you sure you want to delete ${deleteAdmin?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteAdmin(null)}
          onConfirm={() => {
          adminState
            .deleteAdmin(deleteAdmin.id)
            .then(() => setDeleteAdmin(null))
            .catch(() => {});
        }}
      />
    </div>
  );
}
