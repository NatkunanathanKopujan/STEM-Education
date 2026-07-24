import { useState } from 'react';
import { EntityForm } from '../../components/admin/EntityForm';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert, SuccessAlert } from '../../components/ui/Alerts';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { Pagination } from '../../components/ui/Pagination';
import { useEntityManagement } from '../../hooks/useEntityManagement';

export function CurriculumManagementPage() {
  const state = useEntityManagement([], 'curriculum');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [teacherListItem, setTeacherListItem] = useState(null);
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

  const openView = async (item) => {
    try {
      setViewingItem(await state.viewItem(item.id));
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
        <SuccessAlert message={state.successMessage} />
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <SearchBar value={state.query} onChange={(event) => state.setQuery(event.target.value)} placeholder="Search curriculums" />
          <SelectBox value={state.statusFilter} onChange={(event) => state.setStatusFilter(event.target.value)} options={[{ label: 'All Status', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Archived', value: 'Archived' }]} />
        </div>
      </Card>
      {state.isLoading ? <Loader label="Loading curriculums" /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {!state.isLoading && state.items.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{item.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description || 'No description added.'}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  Department: {item.departmentName || 'Not assigned'}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <p className="rounded-xl bg-page p-3 text-sm text-muted">Subjects: <span className="font-semibold text-ink">{item.subjects || 0}</span></p>
              <p className="rounded-xl bg-page p-3 text-sm text-muted">Materials: <span className="font-semibold text-ink">{item.materials || 0}</span></p>
              <button
                type="button"
                className="rounded-xl bg-page p-3 text-left text-sm text-muted transition hover:border-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
                onClick={() => setTeacherListItem(item)}
              >
                Teachers: <span className="font-semibold text-ink">{item.teachers?.length || 0}</span>
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => openView(item)}>View Curriculum</Button>
              <Button variant="secondary" disabled={state.isSaving} onClick={() => { setEditingItem(item); setModalOpen(true); }}>Edit</Button>
              <Button variant="secondary" disabled={state.isSaving} onClick={() => state.updateItem(item.id, { ...item, status: item.status === 'Active' ? 'Archived' : 'Active' })}>{item.status === 'Active' ? 'Archive' : 'Activate'}</Button>
              <Button variant="danger" disabled={state.isSaving} onClick={() => setDeleteItem(item)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
      {!state.isLoading && !state.items.length ? (
        <EmptyState title="No curriculums found" description="Only curriculums created in the database will appear here." />
      ) : null}
      {!state.isLoading && state.items.length ? (
        <Card className="p-4">
          <Pagination page={state.page} totalPages={state.totalPages} onPageChange={state.setPage} />
        </Card>
      ) : null}
      <Modal open={modalOpen} title={editingItem ? 'Edit Curriculum' : 'Create Curriculum'} onClose={() => setModalOpen(false)}>
        <EntityForm type="curriculum" item={editingItem} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} generateUsername={state.generateUsername} />
      </Modal>
      <Modal open={Boolean(viewingItem)} title="Curriculum Details" onClose={() => setViewingItem(null)}>
        {viewingItem ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-ink">{viewingItem.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{viewingItem.description || 'No description added.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Code', viewingItem.code || '-'],
                ['Department', viewingItem.departmentName || 'Not assigned'],
                ['Status', viewingItem.status],
                ['Subjects', viewingItem.subjects || 0],
                ['Materials', viewingItem.materials || 0],
                ['Assigned Teachers', viewingItem.teachers?.length || 0],
                ['Created Date', viewingItem.createdDate || '-'],
              ].map(([key, value]) => (
                <div key={key} className="rounded-lg border border-line bg-page p-3">
                  <p className="text-xs uppercase text-muted">{key}</p>
                  <p className="mt-1 font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-line bg-page p-3">
              <p className="text-xs uppercase text-muted">Teacher Usernames</p>
              {viewingItem.teachers?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {viewingItem.teachers.map((teacher) => (
                    <span key={teacher.id} className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-ink">
                      {teacher.username || teacher.fullName}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 font-semibold text-ink">No teachers assigned</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal open={Boolean(teacherListItem)} title="Assigned Teachers" onClose={() => setTeacherListItem(null)}>
        {teacherListItem ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-ink">{teacherListItem.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {teacherListItem.teachers?.length || 0} teacher{teacherListItem.teachers?.length === 1 ? '' : 's'} assigned.
              </p>
            </div>
            {teacherListItem.teachers?.length ? (
              <div className="space-y-2">
                {teacherListItem.teachers.map((teacher) => (
                  <div key={teacher.id} className="rounded-lg border border-line bg-page p-3">
                    <p className="font-semibold text-ink">{teacher.fullName}</p>
                    <p className="mt-1 text-sm text-muted">Username: <span className="font-semibold text-ink">{teacher.username || '-'}</span></p>
                    {teacher.employeeNo ? <p className="mt-1 text-sm text-muted">Employee No: <span className="font-semibold text-ink">{teacher.employeeNo}</span></p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No teachers assigned" description="Assign teachers from the curriculum edit form." />
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setTeacherListItem(null)}>Close</Button>
            </div>
          </div>
        ) : null}
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
