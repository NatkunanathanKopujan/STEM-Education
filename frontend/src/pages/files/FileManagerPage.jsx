import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiArchive,
  FiDownload,
  FiEdit3,
  FiEye,
  FiFile,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, DashboardCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { fileService } from '../../services/fileService';

const acceptedTypes = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp,.mp4,.mov,.avi,.mp3,.wav';

function formatBytes(value = 0) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function buildDefaultMetadata() {
  return {
    curriculum: '',
    subject: '',
    weekNo: '',
    topic: '',
    description: '',
    visibility: 'private',
    status: 'active',
    tags: '',
  };
}

function apiErrorMessage(error, fallback) {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length) {
    return details.map((item) => `${item.path || item.param}: ${item.msg}`).join(', ');
  }
  return error.response?.data?.message || fallback;
}

export function FileManagerPage() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', fileType: '', visibility: '', status: '', sort: 'newest', page: 1 });
  const [metadata, setMetadata] = useState(buildDefaultMetadata);
  const [queue, setQueue] = useState([]);
  const [versions, setVersions] = useState(null);
  const [versionTarget, setVersionTarget] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileMeta, setPreviewFileMeta] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editForm, setEditForm] = useState(buildDefaultMetadata);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const totalPages = useMemo(() => Math.max(Math.ceil((files.total || 0) / (files.limit || 20)), 1), [files]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [fileData, statData] = await Promise.all([
        fileService.list({ ...filters, limit: 20 }),
        fileService.statistics().catch(() => null),
      ]);
      setFiles(fileData);
      setStats(statData);
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Unable to load files.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enqueueFiles = (fileList) => {
    setQueue(Array.from(fileList || []).map((file) => ({ file, progress: 0, status: 'queued', error: '' })));
  };

  const selectedFiles = (event) => {
    enqueueFiles(event.target.files);
  };

  const uploadQueue = async (onlyFailed = false) => {
    if (!queue.length) return;
    setIsUploading(true);
    const uploaded = [];

    for (const item of queue.filter((entry) => !onlyFailed || entry.status === 'failed')) {
      setQueue((current) =>
        current.map((entry) => (entry.file === item.file ? { ...entry, status: 'uploading', error: '' } : entry)),
      );
      try {
        const result = await fileService.upload(
          item.file,
          {
            ...metadata,
            parentFileId: versionTarget?.id,
            versionNote: versionTarget ? `Version update for ${versionTarget.originalFileName}` : metadata.versionNote,
          },
          (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || item.file.size));
          setQueue((current) =>
            current.map((entry) => (entry.file === item.file ? { ...entry, progress } : entry)),
          );
          },
        );
        uploaded.push(result);
        setQueue((current) =>
          current.map((entry) => (entry.file === item.file ? { ...entry, progress: 100, status: 'done' } : entry)),
        );
      } catch (error) {
        setQueue((current) =>
          current.map((entry) =>
            entry.file === item.file
              ? {
                  ...entry,
                  status: 'failed',
                  error: apiErrorMessage(error, 'Upload failed'),
                }
              : entry,
          ),
        );
      }
    }

    setMessage(`${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded.`);
    setIsUploading(false);
    if (uploaded.length && versionTarget) setVersionTarget(null);
    await loadData();
  };

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const previewFile = async (file) => {
    setError('');
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await fileService.previewBlob(file.id);
      setPreviewUrl(url);
      setPreviewFileMeta(file);
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Preview failed.'));
    }
  };

  const downloadFile = async (file) => {
    setError('');
    try {
      const blob = await fileService.downloadBlob(file.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Download failed.'));
    }
  };

  const removeFile = async (file) => {
    if (!window.confirm(`Archive ${file.originalFileName}?`)) return;
    setError('');
    try {
      await fileService.remove(file.id);
      setMessage(`${file.originalFileName} archived.`);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Archive failed.'));
    }
  };

  const loadVersions = async (file) => {
    setError('');
    try {
      setVersions(await fileService.history(file.id));
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Unable to load version history.'));
    }
  };

  const restoreVersion = async (versionId) => {
    setError('');
    try {
      await fileService.restoreVersion(versionId);
      setMessage('File version restored.');
      setVersions(null);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Restore version failed.'));
    }
  };

  const startEdit = (file) => {
    setEditingFile(file);
    setEditForm({
      curriculum: file.curriculum || '',
      subject: file.subject || '',
      weekNo: file.weekNo || '',
      topic: file.topic || '',
      description: file.description || '',
      visibility: file.visibility || 'private',
      status: file.status || 'active',
      tags: file.tags || '',
    });
  };

  const updateEditField = (key, value) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const saveFileChanges = async () => {
    if (!editingFile) return;
    setError('');
    try {
      await fileService.update(editingFile.id, editForm);
      setMessage(`${editingFile.originalFileName} updated.`);
      setEditingFile(null);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'File update failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Storage"
        title="File Management"
        description="Manage LMS files, storage usage, previews, secure downloads, and version history."
      />
      <div className="flex justify-end">
        <Button variant="secondary" onClick={loadData}>
          <FiRefreshCw />
          Refresh
        </Button>
      </div>
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Files" value={Number(stats?.summary?.totalFiles || 0).toLocaleString()} icon={FiFile} />
        <DashboardCard title="Storage Used" value={formatBytes(stats?.summary?.totalStorageUsed)} icon={FiArchive} />
        <DashboardCard title="Recent Uploads" value={stats?.recentUploads?.length || 0} icon={FiUploadCloud} />
        <DashboardCard title="Avg File Size" value={formatBytes(stats?.summary?.averageFileSize)} icon={FiRefreshCw} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Storage by File Type</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byType || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="fileType" />
                <YAxis tickFormatter={formatBytes} />
                <Tooltip formatter={(value) => formatBytes(value)} />
                <Bar dataKey="storageUsed" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Upload Files</h2>
          {versionTarget ? (
            <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm font-semibold text-primary">
              Creating a new version of {versionTarget.originalFileName}
            </div>
          ) : null}
          <label
            className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-line bg-page p-6 text-center hover:border-primary"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              enqueueFiles(event.dataTransfer.files);
            }}
          >
            <input type="file" className="sr-only" multiple accept={acceptedTypes} onChange={selectedFiles} />
            <FiUploadCloud className="mx-auto size-8 text-primary" />
            <span className="mt-3 block text-sm font-bold text-ink">Drag, drop, or browse files</span>
            <span className="mt-1 block text-xs text-muted">PDF, Office files, ZIP, images, videos, and audio-ready formats.</span>
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {['curriculum', 'subject', 'weekNo', 'topic'].map((field) => (
              <input
                key={field}
                value={metadata[field]}
                onChange={(event) => setMetadata((current) => ({ ...current, [field]: event.target.value }))}
                placeholder={field === 'weekNo' ? 'Week' : field}
                className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
              />
            ))}
          </div>
          <textarea
            value={metadata.description}
            onChange={(event) => setMetadata((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
            className="mt-3 min-h-20 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            value={metadata.versionNote || ''}
            onChange={(event) => setMetadata((current) => ({ ...current, versionNote: event.target.value }))}
            placeholder="Version note"
            className="mt-3 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select value={metadata.visibility} onChange={(event) => setMetadata((current) => ({ ...current, visibility: event.target.value }))} className="min-h-11 rounded-xl border border-line px-3 text-sm">
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="draft">Draft</option>
            </select>
            <input value={metadata.tags} onChange={(event) => setMetadata((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags" className="min-h-11 rounded-xl border border-line px-3 text-sm" />
          </div>
          <div className="mt-4 space-y-2">
            {queue.map((item) => (
              <div key={item.file.name} className="rounded-xl bg-page p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-ink">{item.file.name}</span>
                  <span className="text-muted">{item.status}</span>
                </div>
                {item.error ? <p className="mt-1 text-xs font-semibold text-red-600">{item.error}</p> : null}
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={!queue.length} isLoading={isUploading} onClick={() => uploadQueue()}>Upload Queue</Button>
            <Button variant="secondary" disabled={!queue.some((item) => item.status === 'failed') || isUploading} onClick={() => uploadQueue(true)}>Retry Failed</Button>
            <Button variant="secondary" disabled={!queue.length || isUploading} onClick={() => setQueue([])}>Cancel Queue</Button>
            {versionTarget ? <Button variant="ghost" onClick={() => setVersionTarget(null)}>Clear Version Target</Button> : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_repeat(4,12rem)]">
          <label className="relative">
            <FiSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search by file, topic, teacher, curriculum" className="min-h-11 w-full rounded-xl border border-line pl-10 pr-3 text-sm outline-none focus:border-primary" />
          </label>
          <select value={filters.fileType} onChange={(event) => updateFilter('fileType', event.target.value)} className="min-h-11 rounded-xl border border-line px-3 text-sm">
            <option value="">All Types</option>
            {['pdf', 'ppt', 'documents', 'spreadsheets', 'archives', 'images', 'videos', 'audio'].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={filters.visibility} onChange={(event) => updateFilter('visibility', event.target.value)} className="min-h-11 rounded-xl border border-line px-3 text-sm">
            <option value="">Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="restricted">Restricted</option>
            <option value="draft">Draft</option>
          </select>
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="min-h-11 rounded-xl border border-line px-3 text-sm">
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
            <option value="deleted">Deleted</option>
          </select>
          <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="min-h-11 rounded-xl border border-line px-3 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
            <option value="largest">Largest</option>
            <option value="mostDownloaded">Most Downloaded</option>
            <option value="mostViewed">Most Viewed</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ['curriculum', 'Curriculum'],
            ['subject', 'Subject'],
            ['teacher', 'Teacher'],
            ['topic', 'Topic'],
            ['weekNo', 'Week'],
          ].map(([key, label]) => (
            <input
              key={key}
              value={filters[key] || ''}
              onChange={(event) => updateFilter(key, event.target.value)}
              placeholder={label}
              className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            />
          ))}
          <input
            value={filters.minSize || ''}
            onChange={(event) => updateFilter('minSize', event.target.value)}
            placeholder="Min size bytes"
            className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={filters.maxSize || ''}
            onChange={(event) => updateFilter('maxSize', event.target.value)}
            placeholder="Max size bytes"
            className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={filters.dateFrom || ''}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
            type="date"
            className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={filters.dateTo || ''}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
            type="date"
            className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      {isLoading ? <Loader label="Loading files" /> : null}
      {!isLoading && !files.files?.length ? <EmptyState title="No files found" description="Upload a file or adjust filters to see managed resources." /> : null}
      {!isLoading && files.files?.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-page text-left text-xs uppercase text-muted">
                <tr>
                  {['File', 'Folder', 'Type', 'Size', 'Visibility', 'Usage', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {files.files.map((file) => (
                  <tr key={file.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-bold text-ink">{file.originalFileName}</p>
                      <p className="mt-1 text-xs text-muted">{file.owner || 'System'} - Version {file.version}</p>
                    </td>
                    <td className="px-4 py-4 text-muted">{file.logicalFolder || '-'}</td>
                    <td className="px-4 py-4 capitalize">{file.fileType}</td>
                    <td className="px-4 py-4">{formatBytes(file.fileSize)}</td>
                    <td className="px-4 py-4 capitalize">{file.visibility}</td>
                    <td className="px-4 py-4 text-muted">{file.downloadCount} downloads / {file.viewCount} views</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" className="min-h-9 px-2" aria-label={`Preview ${file.originalFileName}`} onClick={() => previewFile(file)}><FiEye /></Button>
                        <Button variant="ghost" className="min-h-9 px-2" aria-label={`Edit ${file.originalFileName}`} onClick={() => startEdit(file)}><FiEdit3 /></Button>
                        <Button variant="ghost" className="min-h-9 px-2" aria-label={`Download ${file.originalFileName}`} onClick={() => downloadFile(file)}><FiDownload /></Button>
                        <Button variant="ghost" className="min-h-9 px-2" aria-label={`View version history for ${file.originalFileName}`} onClick={() => loadVersions(file)}><FiRefreshCw /></Button>
                        <Button variant="ghost" className="min-h-9 px-2" aria-label="Upload new version" onClick={() => { setVersionTarget(file); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><FiUploadCloud /></Button>
                        <Button variant="ghost" className="min-h-9 px-2 text-red-600" aria-label={`Delete ${file.originalFileName}`} onClick={() => removeFile(file)}><FiTrash2 /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-line p-4">
            <Button variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button>
            <span className="text-sm font-semibold text-muted">Page {filters.page} of {totalPages}</span>
            <Button variant="secondary" disabled={filters.page >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button>
          </div>
        </Card>
      ) : null}

      {previewUrl ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ink">Secure Preview</h2>
            <Button variant="secondary" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); setPreviewFileMeta(null); }}>Close</Button>
          </div>
          {previewFileMeta?.fileType === 'images' ? (
            <img src={previewUrl} alt={previewFileMeta.originalFileName} className="max-h-[32rem] w-full rounded-xl border border-line object-contain" />
          ) : null}
          {previewFileMeta?.fileType === 'videos' ? (
            <video src={previewUrl} controls className="max-h-[32rem] w-full rounded-xl border border-line" />
          ) : null}
          {!['images', 'videos'].includes(previewFileMeta?.fileType) ? (
            <iframe title="File preview" src={previewUrl} className="h-[32rem] w-full rounded-xl border border-line" />
          ) : null}
        </Card>
      ) : null}

      {versions ? (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-ink">Version History: {versions.file.originalFileName}</h2>
            <Button variant="secondary" onClick={() => setVersions(null)}>Close</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {versions.versions.map((version) => (
              <div key={version.id} className="flex flex-col gap-3 rounded-xl border border-line p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-ink">Version {version.version} {version.isCurrent ? '(Current)' : ''}</p>
                  <p className="text-sm text-muted">{version.originalFileName} - {formatBytes(version.fileSize)}</p>
                </div>
                <Button variant="secondary" disabled={Boolean(version.isCurrent)} onClick={() => restoreVersion(version.id)}>Restore</Button>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Modal
        open={Boolean(editingFile)}
        title={editingFile ? `Edit ${editingFile.originalFileName}` : 'Edit file'}
        onClose={() => setEditingFile(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditingFile(null)}>Cancel</Button>
            <Button onClick={saveFileChanges}>Save Changes</Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['curriculum', 'Curriculum'],
            ['subject', 'Subject'],
            ['weekNo', 'Week'],
            ['topic', 'Topic'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase text-muted">{label}</span>
              <input
                value={editForm[key] || ''}
                onChange={(event) => updateEditField(key, event.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Visibility</span>
            <select
              value={editForm.visibility}
              onChange={(event) => updateEditField('visibility', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Status</span>
            <select
              value={editForm.status}
              onChange={(event) => updateEditField('status', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase text-muted">Tags</span>
          <input
            value={editForm.tags || ''}
            onChange={(event) => updateEditField('tags', event.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase text-muted">Description</span>
          <textarea
            value={editForm.description || ''}
            onChange={(event) => updateEditField('description', event.target.value)}
            className="mt-1 min-h-24 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </Modal>
    </div>
  );
}
