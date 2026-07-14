import { useState } from 'react';
import { EntityForm } from '../../components/admin/EntityForm';
import { EntityTable } from '../../components/admin/EntityTable';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/Alerts';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { useEntityManagement } from '../../hooks/useEntityManagement';

export function PeopleManagementPage({ type }) {
  const isTeacher = type === 'teacher';
  const state = useEntityManagement([], type);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title={title} description={`Create, search, edit, activate, deactivate, reset, and delete ${label.toLowerCase()} accounts.`} actionLabel={`Create ${label}`} onAction={openCreate} />
      <Card className="p-5">
        <ErrorAlert message={state.errorMessage} />
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <SearchBar value={state.query} onChange={(event) => state.setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}s`} />
          <SelectBox value={state.statusFilter} onChange={(event) => state.setStatusFilter(event.target.value)} options={[{ label: 'All Status', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
          <Button disabled={state.isSaving} onClick={openCreate}>Create {label}</Button>
        </div>
      </Card>
      {state.isLoading ? <Loader label={`Loading ${label.toLowerCase()}s`} /> : null}
      <EntityTable
        type={type}
        items={state.filteredItems}
        isLoading={state.isLoading}
        isSaving={state.isSaving}
        onEdit={(item) => { setEditingItem(item); setModalOpen(true); }}
        onDelete={setDeleteItem}
        onToggleStatus={(item) => state.updateItem(item.id, { status: item.status === 'Active' ? 'Inactive' : 'Active' })}
      />
      <Modal open={modalOpen} title={editingItem ? `Edit ${label}` : `Create ${label}`} onClose={() => setModalOpen(false)}>
        <EntityForm type={type} item={editingItem} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} generateUsername={state.generateUsername} />
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
