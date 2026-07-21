import { useState } from 'react';
import { EntityForm } from '../../components/admin/EntityForm';
import { EntityTable } from '../../components/admin/EntityTable';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { useEntityManagement } from '../../hooks/useEntityManagement';

export function PeopleManagementPage({ type }) {
  const isTeacher = type === 'teacher';
  const isStudent = type === 'student';
  const state = useEntityManagement([], type);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const title = isTeacher ? 'Teacher Management' : 'Student Management';
  const label = isTeacher ? 'Teacher' : 'Student';

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editingItem) await state.updateItem(editingItem.id, values);
      else await state.createItem(values);
      setModalOpen(false);
      setEditingItem(null);
    } catch {
      // The hook owns the user-facing error message.
    }
  };

  const openView = async (item) => {
    try {
      setViewingItem(await state.viewItem(item.id));
    } catch {
      // The hook owns the user-facing error message.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title={title} description={`Create, search, view, edit, activate, deactivate, and delete ${label.toLowerCase()} accounts from live database records.`} actionLabel={`Create ${label}`} onAction={openCreate} />
      <Card className="p-5">
        <ErrorAlert message={state.errorMessage} />
        <SuccessAlert message={state.successMessage} />
        <div className="grid gap-3 md:grid-cols-[1fr_170px_180px_150px_auto]">
          <SearchBar value={state.query} onChange={(event) => state.setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}s`} />
          <SelectBox value={state.statusFilter} onChange={(event) => state.setStatusFilter(event.target.value)} options={[{ label: 'All Status', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
          <SelectBox
            value={state.sortField}
            onChange={(event) => state.setSortField(event.target.value)}
            options={[
              { label: 'Sort: Created Date', value: 'createdDate' },
              { label: 'Sort: Name', value: 'fullName' },
              { label: 'Sort: Username', value: 'username' },
              { label: 'Sort: Email', value: 'email' },
              { label: isTeacher ? 'Sort: Employee No' : 'Sort: Student ID', value: 'code' },
              { label: 'Sort: Status', value: 'status' },
            ]}
          />
          <SelectBox
            value={state.sortDirection}
            onChange={(event) => state.setSortDirection(event.target.value)}
            options={[
              { label: 'Newest / Z-A', value: 'desc' },
              { label: 'Oldest / A-Z', value: 'asc' },
            ]}
          />
          <Button disabled={state.isSaving} onClick={openCreate}>Create {label}</Button>
        </div>
      </Card>
      {state.isLoading ? <Loader label={`Loading ${label.toLowerCase()}s`} /> : null}
      <EntityTable
        type={type}
        items={state.items}
        isLoading={state.isLoading}
        isSaving={state.isSaving}
        page={state.page}
        totalPages={state.totalPages}
        onPageChange={state.setPage}
        onView={openView}
        onEdit={(item) => { setEditingItem(item); setModalOpen(true); }}
        onDelete={setDeleteItem}
        onToggleStatus={(item) => state.updateItem(item.id, { status: item.status === 'Active' ? 'Inactive' : 'Active' })}
      />
      <Modal open={modalOpen} title={editingItem ? `Edit ${label}` : `Create ${label}`} onClose={() => setModalOpen(false)}>
        <EntityForm type={type} item={editingItem} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} generateUsername={state.generateUsername} />
      </Modal>
      <Modal open={Boolean(viewingItem)} title={`${label} Details`} onClose={() => setViewingItem(null)}>
        {viewingItem ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-xl bg-orange-50 text-lg font-bold text-primary">
                {viewingItem.photo}
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink">{viewingItem.fullName}</h3>
                <p className="text-sm text-muted">{viewingItem.username}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                isStudent ? ['Student ID', viewingItem.studentId || '-'] : null,
                ['Email', viewingItem.email],
                ['Phone', viewingItem.phone || '-'],
                [isTeacher ? 'Department' : 'Curriculum', isTeacher ? viewingItem.department || '-' : viewingItem.curriculum || '-'],
                isTeacher ? ['Qualification', viewingItem.qualification || '-'] : ['Batch', viewingItem.batch || '-'],
                ['Status', viewingItem.status],
                ['Created Date', viewingItem.createdDate || '-'],
              ].filter(Boolean).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-line bg-page p-3">
                  <p className="text-xs uppercase text-muted">{key}</p>
                  <p className="mt-1 font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <ConfirmationDialog
        open={Boolean(deleteItem)}
        title={`Delete ${label.toLowerCase()}`}
        message={`Are you sure you want to delete ${deleteItem?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          state
            .deleteItem(deleteItem.id)
            .then(() => setDeleteItem(null))
            .catch(() => {});
        }}
      />
    </div>
  );
}
