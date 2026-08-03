import { useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiBookOpen,
  FiChevronDown,
  FiDownload,
  FiFile,
  FiFileText,
  FiFolder,
  FiImage,
  FiLayers,
  FiMusic,
  FiPackage,
  FiMonitor,
  FiVideo,
} from 'react-icons/fi';
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
import { fileService } from '../../services/fileService';
import { userManagementService } from '../../services/userManagementService';
import { getFileIdentity } from '../../utils/fileTypes';

const emptyModuleForm = {
  title: '',
  code: '',
  description: '',
  creditHours: '',
  status: 'Active',
};

function formatBytes(value = 0) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}

function formatWeekLabel(value) {
  if (!value) return 'Week not set';
  return `Week ${String(value).padStart(2, '0')}`;
}

function getFileIcon(file = {}) {
  const category = getFileIdentity(file).category;
  if (category === 'video') return FiVideo;
  if (category === 'image') return FiImage;
  if (category === 'audio') return FiMusic;
  if (category === 'archive') return FiPackage;
  if (category === 'presentation') return FiLayers;
  if (category === 'spreadsheet') return FiBarChart2;
  if (category === 'pdf' || category === 'word' || category === 'text') return FiFileText;
  return FiFile;
}

function getFileTypeLabel(file = {}) {
  const identity = getFileIdentity(file);
  if (identity.category === 'pdf') return 'PDF Notes';
  if (identity.category === 'presentation') return 'PowerPoint';
  if (identity.category === 'word') return 'Word Document';
  if (identity.category === 'spreadsheet') return 'Spreadsheet';
  if (identity.category === 'archive') return 'Archive';
  return identity.label || 'Other Material';
}

function normalizeWeeks(module = {}) {
  const weeks = Array.isArray(module.weeks) && module.weeks.length ? module.weeks : [{ weekNo: 1, files: [] }];
  return [...weeks].sort((a, b) => Number(a.weekNo || 0) - Number(b.weekNo || 0));
}

function Breadcrumb({ items }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.onClick && !isLast ? (
              <button type="button" onClick={item.onClick} className="transition hover:text-primary">
                {item.label}
              </button>
            ) : (
              <span className={isLast ? 'text-ink' : ''}>{item.label}</span>
            )}
            {!isLast ? <span className="text-line">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}

export function CurriculumManagementPage() {
  const state = useEntityManagement([], 'curriculum');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [teacherListItem, setTeacherListItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleError, setModuleError] = useState('');
  const [moduleSuccess, setModuleSuccess] = useState('');
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [editingModule, setEditingModule] = useState(null);
  const [deleteModule, setDeleteModule] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const departmentGroups = useMemo(() => {
    const groups = new Map();
    state.items.forEach((item) => {
      const key = item.departmentId ? `department-${item.departmentId}` : `name-${item.departmentName || 'unassigned'}`;
      const name = item.departmentName || 'Not assigned';
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          id: item.departmentId || null,
          name,
          curriculums: [],
          active: 0,
          archived: 0,
          subjects: 0,
          materials: 0,
          teachers: 0,
        });
      }
      const group = groups.get(key);
      group.curriculums.push(item);
      group.active += item.status === 'Active' ? 1 : 0;
      group.archived += item.status === 'Archived' ? 1 : 0;
      group.subjects += Number(item.subjects || 0);
      group.materials += Number(item.materials || 0);
      group.teachers += Number(item.teachers?.length || 0);
    });
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.items]);

  const selectedDepartment = departmentGroups.find((department) => department.key === selectedDepartmentKey) || null;
  const visibleCurriculums = selectedDepartment ? selectedDepartment.curriculums : [];
  const currentModule = selectedModule ? modules.find((module) => module.id === selectedModule.id) || selectedModule : null;
  const currentModuleWeeks = currentModule ? normalizeWeeks(currentModule) : [];

  useEffect(() => {
    setSelectedDepartmentKey('');
    setSelectedCurriculum(null);
    setSelectedModule(null);
    setExpandedWeeks({});
  }, [state.query, state.statusFilter, state.page]);

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

  const loadModules = async (curriculumId) => {
    setModulesLoading(true);
    setModuleError('');
    try {
      const response = await userManagementService.listModules(curriculumId);
      setModules(response.modules || []);
    } catch (error) {
      setModuleError(error.response?.data?.message || 'Unable to load subject/modules.');
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const resetModuleForm = () => {
    setModuleForm(emptyModuleForm);
    setEditingModule(null);
    setModuleError('');
  };

  const openCurriculumModules = async (item) => {
    setSelectedCurriculum(item);
    setSelectedModule(null);
    setExpandedWeeks({});
    setModuleForm(emptyModuleForm);
    setEditingModule(null);
    setModuleSuccess('');
    await loadModules(item.id);
  };

  const submitModule = async (event) => {
    event.preventDefault();
    if (!selectedCurriculum) return;
    setModuleSaving(true);
    setModuleError('');
    setModuleSuccess('');
    try {
      if (editingModule) {
        const updated = await userManagementService.updateModule(selectedCurriculum.id, editingModule.id, moduleForm);
        setModules((current) =>
          current.map((module) => (module.id === editingModule.id ? { ...module, ...updated, weeks: module.weeks || [] } : module)),
        );
        setSelectedModule((current) => (current?.id === editingModule.id ? { ...current, ...updated, weeks: current.weeks || [] } : current));
        setModuleSuccess('Subject/Module updated successfully.');
      } else {
        const created = await userManagementService.createModule(selectedCurriculum.id, moduleForm);
        setModules((current) => [created, ...current]);
        setSelectedCurriculum((current) => (current ? { ...current, subjects: Number(current.subjects || 0) + 1 } : current));
        setModuleSuccess('Subject/Module created successfully.');
      }
      resetModuleForm();
      await state.loadItems();
    } catch (error) {
      setModuleError(error.response?.data?.message || 'Unable to save subject/module.');
    } finally {
      setModuleSaving(false);
    }
  };

  const startEditModule = (module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title || '',
      code: module.code || '',
      description: module.description || '',
      creditHours: module.creditHours || '',
      status: module.status || 'Active',
    });
    setModuleError('');
    setModuleSuccess('');
  };

  const confirmDeleteModule = async () => {
    if (!selectedCurriculum || !deleteModule) return;
    setModuleSaving(true);
    setModuleError('');
    setModuleSuccess('');
    try {
      await userManagementService.removeModule(selectedCurriculum.id, deleteModule.id);
      setModules((current) => current.filter((module) => module.id !== deleteModule.id));
      setSelectedModule((current) => (current?.id === deleteModule.id ? null : current));
      setSelectedCurriculum((current) => (current ? { ...current, subjects: Math.max(Number(current.subjects || 0) - 1, 0) } : current));
      setDeleteModule(null);
      setModuleSuccess('Subject/Module deleted successfully.');
      await state.loadItems();
    } catch (error) {
      setModuleError(error.response?.data?.message || 'Unable to delete subject/module.');
    } finally {
      setModuleSaving(false);
    }
  };

  const openSubjectView = (module) => {
    const weeks = normalizeWeeks(module);
    setSelectedModule(module);
    setExpandedWeeks(weeks.length ? { [weeks[0].weekNo || 'unassigned']: true } : {});
  };

  const toggleWeek = (weekKey) => {
    setExpandedWeeks((current) => ({ ...current, [weekKey]: !current[weekKey] }));
  };

  const previewMaterial = async (file) => {
    setModuleError('');
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await fileService.previewBlob(file.id);
      setPreviewUrl(url);
      setPreviewFile(file);
    } catch (error) {
      setModuleError(error.response?.data?.message || 'Unable to preview material.');
    }
  };

  const downloadMaterial = async (file) => {
    setModuleError('');
    try {
      const blob = await fileService.downloadBlob(file.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setModuleError(error.response?.data?.message || 'Unable to download material.');
    }
  };

  const previewPanel = previewUrl ? (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold text-ink">Material Preview: {previewFile?.originalFileName}</h2>
        <Button variant="secondary" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); setPreviewFile(null); }}>Close</Button>
      </div>
      {getFileIdentity(previewFile || {}).category === 'image' ? (
        <img src={previewUrl} alt={previewFile.originalFileName} className="max-h-[32rem] w-full rounded-xl border border-line object-contain" />
      ) : null}
      {getFileIdentity(previewFile || {}).category === 'video' ? (
        <video src={previewUrl} controls className="max-h-[32rem] w-full rounded-xl border border-line" />
      ) : null}
      {getFileIdentity(previewFile || {}).category === 'audio' ? (
        <audio src={previewUrl} controls className="w-full rounded-xl border border-line p-4" />
      ) : null}
      {!['image', 'video', 'audio'].includes(getFileIdentity(previewFile || {}).category) ? (
        <iframe title="Material preview" src={previewUrl} className="h-[32rem] w-full rounded-xl border border-line" />
      ) : null}
    </Card>
  ) : null;

  if (selectedCurriculum) {
    const baseBreadcrumb = [
      { label: 'Dashboard' },
      {
        label: 'Curriculum Management',
        onClick: () => {
          setSelectedDepartmentKey('');
          setSelectedCurriculum(null);
          setSelectedModule(null);
          resetModuleForm();
        },
      },
      {
        label: selectedCurriculum.departmentName || selectedDepartment?.name || 'Department',
        onClick: () => {
          setSelectedCurriculum(null);
          setSelectedModule(null);
          resetModuleForm();
        },
      },
      {
        label: selectedCurriculum.name,
        onClick: currentModule ? () => setSelectedModule(null) : undefined,
      },
    ];

    if (currentModule) {
      return (
        <div className="space-y-6">
          <Breadcrumb items={[...baseBreadcrumb, { label: currentModule.title }]} />
          <PageHeader
            eyebrow="Subject / Module"
            title={currentModule.title}
            description={`Week-wise learning materials inside ${selectedCurriculum.name}.`}
            actionLabel="Back to Subjects"
            onAction={() => setSelectedModule(null)}
          />
          <Card className="p-5">
            <ErrorAlert message={moduleError} />
            <SuccessAlert message={moduleSuccess} />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <FiBookOpen size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-ink">{currentModule.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    Code: <span className="font-semibold text-ink">{currentModule.code || '-'}</span>
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{currentModule.description || 'No description added.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                    <span className="rounded-full bg-page px-3 py-1">Credit Hours: <span className="font-semibold text-ink">{currentModule.creditHours || '-'}</span></span>
                    <span className="rounded-full bg-page px-3 py-1">Files: <span className="font-semibold text-ink">{currentModuleWeeks.reduce((total, week) => total + (week.files?.length || 0), 0)}</span></span>
                    <span className="rounded-full bg-page px-3 py-1">Created: <span className="font-semibold text-ink">{currentModule.createdDate || '-'}</span></span>
                  </div>
                </div>
              </div>
              <StatusBadge status={currentModule.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" disabled={moduleSaving} onClick={() => startEditModule(currentModule)}>Edit Subject</Button>
              <Button variant="danger" disabled={moduleSaving} onClick={() => setDeleteModule(currentModule)}>Delete Subject</Button>
            </div>
          </Card>
          <div className="space-y-3">
            {currentModuleWeeks.map((week) => {
              const weekKey = week.weekNo || 'unassigned';
              const files = week.files || [];
              const isOpen = Boolean(expandedWeeks[weekKey]);
              return (
                <Card key={weekKey} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleWeek(weekKey)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-primary/5"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-ink">{formatWeekLabel(week.weekNo)} ({files.length} File{files.length === 1 ? '' : 's'})</h3>
                      <p className="mt-1 text-sm text-muted">Expand to view PDF, PPT, video, assignment, and other learning materials.</p>
                    </div>
                    <FiChevronDown className={`shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} size={22} />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-line p-5">
                      {files.length ? (
                        <div className="divide-y divide-line rounded-2xl border border-line bg-page">
                          {files.map((file) => {
                            const FileIcon = getFileIcon(file);
                            return (
                              <div key={file.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-white text-primary">
                                    <FileIcon size={20} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink">{file.originalFileName}</p>
                                    <p className="mt-1 text-sm text-muted">
                                      {getFileTypeLabel(file)} - {formatBytes(file.fileSize)} - Uploaded {formatDate(file.createdAt || file.uploadDate || file.createdDate)}
                                    </p>
                                    {file.topic ? <p className="mt-1 text-sm text-muted">Topic: <span className="font-semibold text-ink">{file.topic}</span></p> : null}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <Button variant="secondary" onClick={() => previewMaterial(file)}><FiMonitor /> View</Button>
                                  <Button variant="secondary" onClick={() => downloadMaterial(file)}><FiDownload /> Download</Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-line bg-page p-4 text-sm text-muted">
                          No learning materials uploaded for this week.
                        </p>
                      )}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
          {previewPanel}
          <ConfirmationDialog
            open={Boolean(deleteModule)}
            title="Delete subject/module"
            message={`Delete ${deleteModule?.title}?`}
            confirmLabel="Delete"
            isDanger
            onClose={() => setDeleteModule(null)}
            onConfirm={confirmDeleteModule}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Breadcrumb items={baseBreadcrumb} />
        <PageHeader
          eyebrow="Admin"
          title={`${selectedCurriculum.name} Subjects`}
          description={`Select a subject/module to view week-wise learning materials inside ${selectedCurriculum.name}.`}
          actionLabel="Back to Curriculums"
          onAction={() => {
            setSelectedCurriculum(null);
            setSelectedModule(null);
            resetModuleForm();
          }}
        />
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Selected Curriculum</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{selectedCurriculum.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Department: <span className="font-semibold text-ink">{selectedCurriculum.departmentName || 'Not assigned'}</span>
              </p>
            </div>
            <StatusBadge status={selectedCurriculum.status} />
          </div>
        </Card>
        <Card className="p-5">
          <ErrorAlert message={moduleError} />
          <SuccessAlert message={moduleSuccess} />
          <form onSubmit={submitModule} className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Subject/Module Name</span>
              <input
                value={moduleForm.title}
                onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Example: Web Development"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Code</span>
              <input
                value={moduleForm.code}
                onChange={(event) => setModuleForm((current) => ({ ...current, code: event.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Auto-generated if empty"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Credit Hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={moduleForm.creditHours}
                onChange={(event) => setModuleForm((current) => ({ ...current, creditHours: event.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Optional"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Status</span>
              <SelectBox
                value={moduleForm.status}
                onChange={(event) => setModuleForm((current) => ({ ...current, status: event.target.value }))}
                options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
              />
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold text-ink">Description</span>
              <textarea
                value={moduleForm.description}
                onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-28 w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Optional subject/module details"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3 lg:col-span-2">
              {editingModule ? (
                <Button type="button" variant="secondary" onClick={resetModuleForm} disabled={moduleSaving}>
                  Cancel Edit
                </Button>
              ) : null}
              <Button type="submit" disabled={moduleSaving}>
                {editingModule ? 'Update Subject/Module' : 'Create Subject/Module'}
              </Button>
            </div>
          </form>
        </Card>
        {modulesLoading ? <Loader label="Loading subject/modules" /> : null}
        {!modulesLoading && modules.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {modules.map((module) => (
              <Card key={module.id} className="p-0">
                <button type="button" onClick={() => openSubjectView(module)} className="block w-full p-5 text-left transition hover:bg-primary/5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                      <FiBookOpen size={22} />
                    </span>
                    <div>
                    <h3 className="text-lg font-bold text-ink">{module.title}</h3>
                    <p className="mt-1 text-sm text-muted">Code: <span className="font-semibold text-ink">{module.code}</span></p>
                    <p className="mt-2 text-sm leading-6 text-muted">{module.description || 'No description added.'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                      <span className="rounded-full bg-page px-3 py-1">Credit Hours: <span className="font-semibold text-ink">{module.creditHours || '-'}</span></span>
                      <span className="rounded-full bg-page px-3 py-1">Weeks: <span className="font-semibold text-ink">{normalizeWeeks(module).length}</span></span>
                      <span className="rounded-full bg-page px-3 py-1">Files: <span className="font-semibold text-ink">{normalizeWeeks(module).reduce((total, week) => total + (week.files?.length || 0), 0)}</span></span>
                      <span className="rounded-full bg-page px-3 py-1">Created: <span className="font-semibold text-ink">{module.createdDate || '-'}</span></span>
                    </div>
                    </div>
                  </div>
                  <StatusBadge status={module.status} />
                </div>
                </button>
                <div className="flex flex-wrap gap-2 border-t border-line p-4">
                  <Button variant="secondary" onClick={() => openSubjectView(module)}>Open Subject</Button>
                  <Button variant="secondary" disabled={moduleSaving} onClick={() => startEditModule(module)}>Edit</Button>
                  <Button variant="danger" disabled={moduleSaving} onClick={() => setDeleteModule(module)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
        {!modulesLoading && !modules.length ? (
          <EmptyState title="No subjects/modules found" description="Create the first subject/module for this curriculum." />
        ) : null}
        <ConfirmationDialog
          open={Boolean(deleteModule)}
          title="Delete subject/module"
          message={`Delete ${deleteModule?.title}?`}
          confirmLabel="Delete"
          isDanger
          onClose={() => setDeleteModule(null)}
          onConfirm={confirmDeleteModule}
        />
      </div>
    );
  }

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
      {!state.isLoading && !selectedDepartment ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {departmentGroups.map((department) => (
            <button
              key={department.key}
              type="button"
              onClick={() => {
                setSelectedDepartmentKey(department.key);
                setSelectedCurriculum(null);
                setSelectedModule(null);
              }}
              className="rounded-2xl border border-line bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <FiFolder size={22} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Department</p>
                    <h2 className="mt-2 text-xl font-bold text-ink">{department.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {department.curriculums.length} curriculum{department.curriculums.length === 1 ? '' : 's'} available
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  Open
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <p className="rounded-xl bg-page p-3 text-sm text-muted">
                  Active: <span className="font-semibold text-ink">{department.active}</span>
                </p>
                <p className="rounded-xl bg-page p-3 text-sm text-muted">
                  Archived: <span className="font-semibold text-ink">{department.archived}</span>
                </p>
                <p className="rounded-xl bg-page p-3 text-sm text-muted">
                  Materials: <span className="font-semibold text-ink">{department.materials}</span>
                </p>
                <p className="rounded-xl bg-page p-3 text-sm text-muted">
                  Teachers: <span className="font-semibold text-ink">{department.teachers}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
      {!state.isLoading && selectedDepartment ? (
        <div className="space-y-5">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Selected Department</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{selectedDepartment.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {visibleCurriculums.length} curriculum{visibleCurriculums.length === 1 ? '' : 's'} in this department.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDepartmentKey('')}>Back to Departments</Button>
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleCurriculums.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                      <FiLayers size={22} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-ink">{item.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted">{item.description || 'No description added.'}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">
                        Department: {item.departmentName || 'Not assigned'}
                      </p>
                    </div>
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
                  <Button variant="secondary" onClick={() => openCurriculumModules(item)}>View Curriculum</Button>
                  <Button variant="secondary" disabled={state.isSaving} onClick={() => { setEditingItem(item); setModalOpen(true); }}>Edit</Button>
                  <Button variant="secondary" disabled={state.isSaving} onClick={() => state.updateItem(item.id, { ...item, status: item.status === 'Active' ? 'Archived' : 'Active' })}>{item.status === 'Active' ? 'Archive' : 'Activate'}</Button>
                  <Button variant="danger" disabled={state.isSaving} onClick={() => setDeleteItem(item)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
      {!state.isLoading && !departmentGroups.length ? (
        <EmptyState title="No departments found" description="Create curriculums with departments to view them here." />
      ) : null}
      {!state.isLoading && state.items.length ? (
        <Card className="p-4">
          <Pagination page={state.page} totalPages={state.totalPages} onPageChange={state.setPage} />
        </Card>
      ) : null}
      <Modal open={modalOpen} title={editingItem ? 'Edit Curriculum' : 'Create Curriculum'} onClose={() => setModalOpen(false)}>
        <EntityForm type="curriculum" item={editingItem} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} generateUsername={state.generateUsername} />
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
              <EmptyState title="No teachers assigned" description="Assign teachers from Teacher Management." />
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
