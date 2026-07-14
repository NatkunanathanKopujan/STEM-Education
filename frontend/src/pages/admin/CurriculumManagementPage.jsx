import { useState } from 'react';
import { EntityForm } from '../../components/admin/EntityForm';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/Alerts';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { useEntityManagement } from '../../hooks/useEntityManagement';

export function CurriculumManagementPage() {
  const state = useEntityManagement([], 'curriculum');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

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
      <PageHeader
        eyebrow="Admin"
        title="Curriculum Management"
        description="Create, activate, archive, edit, and delete real curriculum records from the database."
        actionLabel="Create Curriculum"
        onAction={openCreate}
      />
      <Card className="p-5">
        <ErrorAlert message={state.errorMessage} />
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <SearchBar value={state.query} onChange={(event) => state.setQuery(event.target.value)} placeholder="Search curriculums" />
          <SelectBox value={state.statusFilter} onChange={(event) => state.setStatusFilter(event.target.value)} options={[{ label: 'All Status', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Archived', value: 'Archived' }]} />
        </div>
      </Card>
      {state.isLoading ? <Loader label="Loading curriculums" /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {!state.isLoading && state.filteredItems.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{item.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description || 'No description added.'}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <p className="rounded-xl bg-page p-3 text-sm text-muted">Subjects: <span className="font-semibold text-ink">{item.subjects || 0}</span></p>
              <p className="rounded-xl bg-page p-3 text-sm text-muted">Materials: <span className="font-semibold text-ink">{item.materials || 0}</span></p>
              <p className="rounded-xl bg-page p-3 text-sm text-muted">Students: <span className="font-semibold text-ink">{item.students || 0}</span></p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary">View Curriculum</Button>
              <Button variant="secondary" disabled={state.isSaving} onClick={() => { setEditingItem(item); setModalOpen(true); }}>Edit</Button>
              <Button variant="secondary" disabled={state.isSaving} onClick={() => state.updateItem(item.id, { ...item, status: item.status === 'Active' ? 'Archived' : 'Active' })}>{item.status === 'Active' ? 'Archive' : 'Activate'}</Button>
              <Button variant="danger" disabled={state.isSaving} onClick={() => setDeleteItem(item)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
      {!state.isLoading && !state.filteredItems.length ? (
        <EmptyState title="No curriculums found" description="Only curriculums created in the database will appear here." />
      ) : null}
      <Modal open={modalOpen} title={editingItem ? 'Edit Curriculum' : 'Create Curriculum'} onClose={() => setModalOpen(false)}>
        <EntityForm type="curriculum" item={editingItem} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} generateUsername={state.generateUsername} />
      </Modal>
      <ConfirmationDialog
        open={Boolean(deleteItem)}
        title="Delete curriculum"
        message={`Delete ${deleteItem?.name}?`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          state.deleteItem(deleteItem.id).then(() => setDeleteItem(null)).catch(() => {});
        }}
      />
    </div>
  );
}
