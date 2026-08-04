import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiDownload,
  FiEdit3,
  FiEye,
  FiFile,
  FiFileText,
  FiImage,
  FiMusic,
  FiPackage,
  FiPlayCircle,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiVideo,
} from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, DashboardCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { departmentService } from '../../services/departmentService';
import { fileService } from '../../services/fileService';
import { notificationService } from '../../services/notificationService';
import { userManagementService } from '../../services/userManagementService';
import { getFileIdentity, isVideoFile } from '../../utils/fileTypes';

const acceptedTypes = [
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.xls',
  '.xlsx',
  '.zip',
  '.jpg',
  '.jpeg',
  '.jfif',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.ico',
  '.avif',
  '.mp4',
  '.mov',
  '.avi',
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
].join(',');
const videoAcceptedTypes = ['.mp4', '.mov', '.avi'].join(',');
const noteAcceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'].join(',');
const audienceOptions = [
  { label: 'All Users', value: 'all' },
  { label: 'Students Only', value: 'student' },
  { label: 'Teachers Only', value: 'teacher' },
  { label: 'Admins Only', value: 'admin' },
  { label: 'Super Admin Only', value: 'super-admin' },
];

const audienceLabels = Object.fromEntries(audienceOptions.map((option) => [option.value, option.label]));
const fileTypeColors = {
  pdf: '#DC2626',
  ppt: '#EA580C',
  presentations: '#EA580C',
  documents: '#2563EB',
  spreadsheets: '#16A34A',
  archives: '#7C3AED',
  images: '#0891B2',
  videos: '#DB2777',
  audio: '#9333EA',
  zip: '#7C3AED',
};
const fallbackFileTypeColors = ['#0EA5E9', '#22C55E', '#A855F7', '#F59E0B', '#EF4444', '#14B8A6'];
const moduleUi = {
  materials: {
    accent: 'from-emerald-500/15 via-teal-500/10 to-cyan-500/10',
    eyebrow: 'Academic Resource Library',
    searchTitle: 'Find learning resources',
    searchPlaceholder: 'Search notes, slides, topics, subjects, or week resources',
    uploadTitle: 'Upload Learning Resource',
    emptyTitle: 'No learning materials found',
    emptyDescription: 'Upload department, curriculum, subject, and week-based resources to build the learning library.',
    stats: ['Resources', 'Storage Used', 'Recent Resources', 'Avg Resource Size'],
  },
  videos: {
    accent: 'from-slate-950 via-slate-900 to-cyan-900',
    eyebrow: 'Video Learning Studio',
    searchTitle: 'Search video lessons',
    searchPlaceholder: 'Search video titles, topics, subjects, teachers, or playlists',
    uploadTitle: 'Upload Video Lesson',
    emptyTitle: 'No videos found',
    emptyDescription: 'Upload video lessons or adjust the filters to see available learning videos.',
    stats: ['Videos', 'Video Storage', 'Recent Videos', 'Avg Video Size'],
  },
  notes: {
    accent: 'from-amber-500/20 via-orange-100/80 to-yellow-50',
    eyebrow: 'Teacher Notebook',
    searchTitle: 'Search teacher notes',
    searchPlaceholder: 'Search lesson notes, summaries, topics, subjects, or weeks',
    uploadTitle: 'Upload Teacher Note',
    emptyTitle: 'No teacher notes found',
    emptyDescription: 'Upload lesson summaries, PDF notes, or document-based teaching notes.',
    stats: ['Notes', 'Notes Storage', 'Recent Notes', 'Avg Note Size'],
  },
  repository: {
    accent: 'from-primary/10 via-card to-primary/5',
    eyebrow: 'Cloud File Repository',
    searchTitle: 'Search and filter files',
    searchPlaceholder: 'Search by file name, topic, teacher, curriculum',
    uploadTitle: 'Upload Files',
    emptyTitle: 'No files found',
    emptyDescription: 'Upload a file or adjust filters to see managed resources.',
    stats: ['Total Files', 'Storage Used', 'Recent Uploads', 'Avg File Size'],
  },
};

function getFileTypeColor(fileType = '', index = 0) {
  return fileTypeColors[String(fileType).toLowerCase()] || fallbackFileTypeColors[index % fallbackFileTypeColors.length];
}

function getFileTypeIcon(file) {
  const category = getFileIdentity(file).category;
  if (category === 'video') return FiVideo;
  if (category === 'image') return FiImage;
  if (category === 'audio') return FiMusic;
  if (category === 'archive') return FiPackage;
  if (category === 'presentation' || category === 'spreadsheet') return FiBarChart2;
  if (category === 'pdf' || category === 'word' || category === 'text') return FiFileText;
  return FiFile;
}

function getFileTypeTone(file) {
  const category = getFileIdentity(file).category;
  const tones = {
    video: {
      card: 'from-violet-500/12 via-card to-slate-950/5',
      icon: 'bg-violet-100 text-violet-700',
      bar: 'from-violet-500 via-indigo-500 to-cyan-500',
    },
    pdf: {
      card: 'from-red-500/10 via-card to-red-50/60',
      icon: 'bg-red-100 text-red-700',
      bar: 'from-red-600 via-rose-500 to-orange-500',
    },
    word: {
      card: 'from-blue-500/10 via-card to-blue-50/60',
      icon: 'bg-blue-100 text-blue-700',
      bar: 'from-blue-600 via-sky-500 to-cyan-500',
    },
    presentation: {
      card: 'from-orange-500/10 via-card to-amber-50/60',
      icon: 'bg-orange-100 text-orange-700',
      bar: 'from-orange-600 via-amber-500 to-yellow-500',
    },
    spreadsheet: {
      card: 'from-green-500/10 via-card to-emerald-50/60',
      icon: 'bg-green-100 text-green-700',
      bar: 'from-green-600 via-emerald-500 to-teal-500',
    },
    image: {
      card: 'from-cyan-500/10 via-card to-sky-50/60',
      icon: 'bg-cyan-100 text-cyan-700',
      bar: 'from-cyan-600 via-teal-500 to-emerald-500',
    },
    audio: {
      card: 'from-purple-500/10 via-card to-fuchsia-50/60',
      icon: 'bg-purple-100 text-purple-700',
      bar: 'from-purple-600 via-fuchsia-500 to-pink-500',
    },
    archive: {
      card: 'from-slate-500/10 via-card to-slate-50/70',
      icon: 'bg-slate-100 text-slate-700',
      bar: 'from-slate-600 via-slate-500 to-zinc-500',
    },
  };
  return tones[category] || {
    card: 'from-primary/10 via-card to-primary/5',
    icon: 'bg-primary/10 text-primary',
    bar: 'from-primary via-teal-500 to-emerald-500',
  };
}

function isTeacherNoteFile(file = {}) {
  return ['pdf', 'word', 'text'].includes(getFileIdentity(file).category);
}

function formatBytes(value = 0) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function buildDefaultMetadata() {
  return {
    departmentId: '',
    curriculumId: '',
    courseId: '',
    curriculum: '',
    subject: '',
    weekNo: '',
    topic: '',
    announcementTitle: '',
    description: '',
    visibility: 'private',
    audience: 'all',
    status: 'active',
    tags: '',
  };
}

function buildAnnouncementPayload(metadata) {
  const departmentId = Number(metadata.departmentId || 0);
  const curriculumId = Number(metadata.curriculumId || 0);
  const courseId = Number(metadata.courseId || 0);
  const weekNo = Number(metadata.weekNo || 0);
  const audienceRole = metadata.audience === 'all' ? null : metadata.audience;
  const targets = audienceRole && ['student', 'teacher'].includes(audienceRole)
    ? [{ targetType: 'department', targetRole: audienceRole, targetId: departmentId }]
    : audienceRole
      ? [{ targetType: 'role', targetRole: audienceRole, targetId: null }]
      : [{ targetType: 'all_users', targetRole: null, targetId: null }];

  return {
    title: metadata.announcementTitle || metadata.topic,
    description: metadata.description,
    audienceRole,
    priority: metadata.priority || 'normal',
    status: metadata.status === 'draft' ? 'draft' : 'published',
    departmentId,
    curriculumId,
    courseId,
    weekNo: weekNo > 0 ? weekNo : null,
    targets,
  };
}

function buildDefaultFilters(initialFilters = {}) {
  return {
    search: '',
    fileType: '',
    visibility: '',
    audience: '',
    status: '',
    sort: 'newest',
    page: 1,
    ...initialFilters,
  };
}

function apiErrorMessage(error, fallback) {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length) {
    return details.map((item) => `${item.path || item.param}: ${item.msg}`).join(', ');
  }
  return error.response?.data?.message || fallback;
}

export function FileManagerPage({
  eyebrow = 'Storage',
  title = 'File Management',
  description = 'Manage LMS files, storage usage, previews, secure downloads, and version history.',
  initialFilters = {},
  lockFileType = false,
  viewMode = 'repository',
} = {}) {
  const { role, user } = useAuth();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(() => buildDefaultFilters(initialFilters));
  const [metadata, setMetadata] = useState(buildDefaultMetadata);
  const [editModules, setEditModules] = useState([]);
  const [uploadMode, setUploadMode] = useState('files');
  const [queue, setQueue] = useState([]);
  const [versions, setVersions] = useState(null);
  const [versionTarget, setVersionTarget] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileMeta, setPreviewFileMeta] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [editForm, setEditForm] = useState(buildDefaultMetadata);
  const [departments, setDepartments] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [modules, setModules] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const totalPages = useMemo(() => Math.max(Math.ceil((files.total || 0) / (files.limit || 20)), 1), [files]);
  const availableCurriculums = useMemo(
    () => curriculums.filter((curriculum) => !metadata.departmentId || Number(curriculum.departmentId) === Number(metadata.departmentId)),
    [curriculums, metadata.departmentId],
  );
  const availableEditCurriculums = useMemo(
    () => curriculums.filter((curriculum) => !editForm.departmentId || Number(curriculum.departmentId) === Number(editForm.departmentId)),
    [curriculums, editForm.departmentId],
  );
  const currentUserId = Number(user?.id || user?.userId || 0);
  const acceptedUploadTypes = uploadMode === 'announcement'
    ? acceptedTypes
    : viewMode === 'videos'
      ? videoAcceptedTypes
      : viewMode === 'notes'
        ? noteAcceptedTypes
        : acceptedTypes;
  const uploadHint = uploadMode === 'announcement'
    ? 'Optional announcement attachments: PDF, Office files, ZIP, images, videos, and audio.'
    : viewMode === 'videos'
      ? 'Video files only: MP4, MOV, or AVI.'
      : viewMode === 'notes'
        ? 'Teacher notes only: PDF, DOC, DOCX, TXT, or MD.'
        : 'PDF, Office files, ZIP, images, videos, and audio-ready formats.';
  const canManageFile = (file) => role === 'super-admin' || Number(file.uploadedBy) === currentUserId;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [fileData, statData] = await Promise.all([
        fileService.list({ ...filters, limit: 20 }),
        fileService.statistics(filters).catch(() => null),
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

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (role === 'student') return;

    let active = true;
    departmentService
      .list({ status: 'active', limit: 100 })
      .then((data) => {
        if (active) setDepartments(data.departments || data.items || []);
      })
      .catch(() => {
        if (active) setDepartments([]);
      });

    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    if (role === 'student') return;

    let active = true;
    userManagementService
      .list('curriculum', { status: 'Active', limit: 100 })
      .then((data) => {
        if (active) setCurriculums(data.curriculums || data.items || []);
      })
      .catch(() => {
        if (active) setCurriculums([]);
      });

    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    if (!metadata.curriculumId) {
      setModules([]);
      return;
    }

    let active = true;
    userManagementService
      .listModules(metadata.curriculumId)
      .then((data) => {
        if (active) setModules((data.modules || []).filter((module) => module.status === 'Active'));
      })
      .catch(() => {
        if (active) setModules([]);
      });

    return () => {
      active = false;
    };
  }, [metadata.curriculumId]);

  useEffect(() => {
    if (!editForm.curriculumId) {
      setEditModules([]);
      return;
    }

    let active = true;
    userManagementService
      .listModules(editForm.curriculumId)
      .then((data) => {
        if (active) setEditModules((data.modules || []).filter((module) => module.status === 'Active'));
      })
      .catch(() => {
        if (active) setEditModules([]);
      });

    return () => {
      active = false;
    };
  }, [editForm.curriculumId]);

  const updateMetadataField = (key, value) => {
    setMetadata((current) => {
      if (key === 'departmentId') {
        return { ...current, departmentId: value, curriculumId: '', courseId: '', curriculum: '', subject: '' };
      }
      if (key === 'curriculumId') {
        const selected = curriculums.find((curriculum) => Number(curriculum.id) === Number(value));
        return {
          ...current,
          curriculumId: value,
          courseId: '',
          curriculum: selected?.name || '',
          subject: '',
        };
      }
      if (key === 'courseId') {
        const selected = modules.find((module) => Number(module.id) === Number(value));
        return { ...current, courseId: value, subject: selected?.title || '' };
      }
      return { ...current, [key]: value };
    });
  };

  const enqueueFiles = (fileList) => {
    setQueue(Array.from(fileList || []).map((file) => ({ file, progress: 0, status: 'queued', error: '' })));
  };

  const selectedFiles = (event) => {
    enqueueFiles(event.target.files);
  };

  const validateAnnouncementUpload = () => {
    if (!metadata.departmentId) return 'Department is required for an announcement.';
    if (!metadata.curriculumId) return 'Curriculum is required for an announcement.';
    if (!metadata.courseId) return 'Subject/Module is required for an announcement.';
    if (!metadata.audience || metadata.audience === 'all') return 'Select Students Only or Teachers Only for scoped announcements.';
    if (!['student', 'teacher'].includes(metadata.audience)) return 'Announcements in this hierarchy can be sent to Students Only or Teachers Only.';
    if (!String(metadata.announcementTitle || metadata.topic || '').trim()) return 'Announcement title is required.';
    if (!String(metadata.description || '').trim()) return 'Announcement content is required.';
    return '';
  };

  const validateFileUpload = () => {
    if (!versionTarget && !metadata.departmentId) return 'Department is required for learning files.';
    if (!versionTarget && !metadata.curriculumId) return 'Curriculum is required for learning files.';
    if (!versionTarget && !metadata.courseId) return 'Subject/Module is required for learning files.';
    if (!versionTarget && (!metadata.weekNo || Number(metadata.weekNo) < 1)) return 'Week number is required for learning files.';
    if (!queue.length) return 'Select at least one file to upload.';
    if (viewMode === 'videos' && queue.some((entry) => !isVideoFile(entry.file))) {
      return 'Videos module accepts only MP4, MOV, or AVI files.';
    }
    if (viewMode === 'notes' && queue.some((entry) => !isTeacherNoteFile(entry.file))) {
      return 'Teacher Notes accepts only PDF, DOC, DOCX, TXT, or MD files.';
    }
    return '';
  };

  const uploadQueue = async (onlyFailed = false) => {
    if (uploadMode === 'announcement') {
      const validationError = validateAnnouncementUpload();
      if (validationError) {
        setError(validationError);
        return;
      }
      setIsUploading(true);
      setError('');
      try {
        const pendingFiles = queue
          .filter((entry) => !onlyFailed || entry.status === 'failed')
          .map((entry) => entry.file);
        await notificationService.createAnnouncement(buildAnnouncementPayload(metadata), pendingFiles);
        setQueue((current) => current.map((entry) => ({ ...entry, progress: 100, status: 'done', error: '' })));
        setMessage('Announcement published.');
        await loadData();
      } catch (apiError) {
        setError(apiErrorMessage(apiError, 'Unable to publish announcement.'));
        setQueue((current) =>
          current.map((entry) => ({ ...entry, status: 'failed', error: apiErrorMessage(apiError, 'Upload failed') })),
        );
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const validationError = validateFileUpload();
    if (validationError) {
      setError(validationError);
      return;
    }
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

  const removeFile = async () => {
    if (!archiveTarget) return;
    setError('');
    try {
      await fileService.remove(archiveTarget.id);
      setMessage(`${archiveTarget.originalFileName} deleted.`);
      setArchiveTarget(null);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'Delete failed.'));
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
    const departmentId = file.targetDepartmentIds?.[0] || '';
    const matchedCurriculum = curriculums.find(
      (curriculum) =>
        Number(curriculum.departmentId) === Number(departmentId) &&
        String(curriculum.name || '').toLowerCase() === String(file.curriculum || '').toLowerCase(),
    );
    setEditingFile(file);
    setEditForm({
      departmentId,
      curriculumId: matchedCurriculum?.id || '',
      courseId: file.courseId || '',
      curriculum: file.curriculum || '',
      subject: file.subject || '',
      weekNo: file.weekNo || '',
      topic: file.topic || '',
      description: file.description || '',
      visibility: file.visibility || 'private',
      status: file.status || 'active',
      audience: file.audience || 'all',
      tags: file.tags || '',
    });
  };

  const updateEditField = (key, value) => {
    setEditForm((current) => {
      if (key === 'departmentId') {
        return { ...current, departmentId: value, curriculumId: '', courseId: '', curriculum: '', subject: '' };
      }
      if (key === 'curriculumId') {
        const selected = curriculums.find((curriculum) => Number(curriculum.id) === Number(value));
        return {
          ...current,
          curriculumId: value,
          courseId: '',
          curriculum: selected?.name || '',
          subject: '',
        };
      }
      if (key === 'courseId') {
        const selected = editModules.find((module) => Number(module.id) === Number(value));
        return { ...current, courseId: value, subject: selected?.title || '' };
      }
      return { ...current, [key]: value };
    });
  };

  const saveFileChanges = async () => {
    if (!editingFile) return;
    setError('');
    try {
      const hasCompleteScope = editForm.departmentId && editForm.curriculumId && editForm.courseId;
      const payload = hasCompleteScope
        ? editForm
        : Object.fromEntries(
            Object.entries(editForm).filter(
              ([key]) => !['departmentId', 'curriculumId', 'courseId'].includes(key),
            ),
          );
      await fileService.update(editingFile.id, payload);
      setMessage(`${editingFile.originalFileName} updated.`);
      setEditingFile(null);
      await loadData();
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'File update failed.'));
    }
  };

  const baseFileItems = files.files || [];
  const fileItems = viewMode === 'videos'
    ? baseFileItems.filter(isVideoFile)
    : viewMode === 'notes'
      ? baseFileItems.filter(isTeacherNoteFile)
      : baseFileItems;
  const ui = moduleUi[viewMode] || moduleUi.repository;
  const statLabels = ui.stats;
  const fileActionButtons = (file, compact = false) => (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'justify-end'}`}>
      <Button variant="ghost" className="min-h-9 px-2" aria-label={`Preview ${file.originalFileName}`} onClick={() => previewFile(file)}><FiEye /></Button>
      {canManageFile(file) ? <Button variant="ghost" className="min-h-9 px-2" aria-label={`Edit ${file.originalFileName}`} onClick={() => startEdit(file)}><FiEdit3 /></Button> : null}
      {role !== 'student' ? <Button variant="ghost" className="min-h-9 px-2" aria-label={`Download ${file.originalFileName}`} onClick={() => downloadFile(file)}><FiDownload /></Button> : null}
      <Button variant="ghost" className="min-h-9 px-2" aria-label={`View version history for ${file.originalFileName}`} onClick={() => loadVersions(file)}><FiRefreshCw /></Button>
      {canManageFile(file) ? <Button variant="ghost" className="min-h-9 px-2" aria-label="Upload new version" onClick={() => { setVersionTarget(file); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><FiUploadCloud /></Button> : null}
      {canManageFile(file) ? <Button variant="ghost" className="min-h-9 px-2 text-red-600" aria-label={`Delete ${file.originalFileName}`} onClick={() => setArchiveTarget(file)}><FiTrash2 /></Button> : null}
    </div>
  );

  const renderSpecializedFiles = () => {
    if (viewMode === 'videos') {
      return (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 text-white shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Video playlists</p>
                <h2 className="mt-2 text-2xl font-black">Learning video library</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">Preview, update, version, and organize video lessons from the same live file database.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold text-slate-300">
                <span className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-lg text-white">{fileItems.length}</b>Shown</span>
                <span className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-lg text-white">{fileItems.reduce((sum, file) => sum + Number(file.viewCount || 0), 0)}</b>Views</span>
                <span className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-lg text-white">{fileItems.reduce((sum, file) => sum + Number(file.downloadCount || 0), 0)}</b>Downloads</span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fileItems.map((file) => {
            const identity = getFileIdentity(file);
            return (
            <Card key={file.id} className="overflow-hidden border-slate-200 bg-slate-950 text-white shadow-xl">
              <button
                type="button"
                onClick={() => previewFile(file)}
                className="relative flex h-52 w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.35),_transparent_36%),linear-gradient(135deg,_#020617,_#0f172a_50%,_#164e63)]"
                aria-label={`Preview ${file.originalFileName}`}
              >
                <span className="absolute left-4 top-4 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-100">{identity.badge}</span>
                <span className="grid size-20 place-items-center rounded-full bg-white/15 shadow-2xl ring-1 ring-white/30 backdrop-blur">
                  <FiPlayCircle className="size-10" />
                </span>
                <span className="absolute bottom-4 right-4 rounded-lg bg-black/50 px-3 py-1 text-xs font-bold">{formatBytes(file.fileSize)}</span>
              </button>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Video Lesson</p>
                  <h3 className="mt-1 line-clamp-2 text-lg font-bold text-white">{file.originalFileName}</h3>
                  <p className="mt-2 text-sm text-slate-300">{file.subject || 'No subject'}{file.weekNo ? ` - Week ${file.weekNo}` : ''}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
                  <span className="rounded-xl bg-white/10 px-3 py-2">Views: {file.viewCount}</span>
                  <span className="rounded-xl bg-white/10 px-3 py-2">Downloads: {file.downloadCount}</span>
                  <span className="rounded-xl bg-white/10 px-3 py-2">Resolution: {file.resolution || '-'}</span>
                  <span className="rounded-xl bg-white/10 px-3 py-2">Duration: {file.duration || '-'}</span>
                  <span className="rounded-xl bg-white/10 px-3 py-2">Version {file.version}</span>
                  <span className="rounded-xl bg-white/10 px-3 py-2 sm:col-span-2">Audience: {audienceLabels[file.audience || 'all'] || file.audience || 'All Users'}</span>
                </div>
                {file.description ? <p className="line-clamp-3 text-sm text-slate-300">{file.description}</p> : null}
                {fileActionButtons(file, true)}
              </div>
            </Card>
          );})}
          </div>
        </div>
      );
    }

    if (viewMode === 'notes') {
      return (
        <Card className="overflow-hidden border-amber-200 bg-[#fffaf0]">
          <div className="border-b border-amber-200 bg-[linear-gradient(90deg,_rgba(251,191,36,0.22),_rgba(255,255,255,0.65))] px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Notebook sections</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Teacher notes and lesson summaries</h2>
          </div>
          <div className="p-5">
          <div className="space-y-3">
            {fileItems.map((file) => {
              const identity = getFileIdentity(file);
              const Icon = getFileTypeIcon(file);
              const tone = getFileTypeTone(file);
              return (
              <div key={file.id} className="flex flex-col gap-4 rounded-none border-l-4 border-amber-400 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone.icon}`}>
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{identity.label} Note</p>
                    <h3 className="font-bold text-ink">{file.originalFileName}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {file.curriculum || 'No curriculum'} - {file.subject || 'No subject'}{file.weekNo ? ` - Week ${file.weekNo}` : ''}
                    </p>
                    {file.description ? <p className="mt-2 max-w-3xl text-sm text-muted">{file.description}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                      <span className="rounded-full bg-card px-3 py-1">{formatBytes(file.fileSize)}</span>
                      <span className="rounded-full bg-card px-3 py-1">Version {file.version}</span>
                      <span className="rounded-full bg-card px-3 py-1">{audienceLabels[file.audience || 'all'] || file.audience || 'All Users'}</span>
                    </div>
                  </div>
                </div>
                {fileActionButtons(file)}
              </div>
            );})}
          </div>
          </div>
        </Card>
      );
    }

    if (viewMode === 'materials') {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Recently shown</p>
              <p className="mt-2 text-3xl font-black text-ink">{fileItems.length}</p>
              <p className="text-sm text-muted">Resources in this result set</p>
            </div>
            <div className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Learning folders</p>
              <p className="mt-2 text-3xl font-black text-ink">{new Set(fileItems.map((file) => file.logicalFolder).filter(Boolean)).size}</p>
              <p className="text-sm text-muted">Department and subject paths</p>
            </div>
            <div className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Week resources</p>
              <p className="mt-2 text-3xl font-black text-ink">{new Set(fileItems.map((file) => file.weekNo).filter(Boolean)).size}</p>
              <p className="text-sm text-muted">Weeks represented</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          {fileItems.map((file) => {
            const identity = getFileIdentity(file);
            const Icon = getFileTypeIcon(file);
            const tone = getFileTypeTone(file);
            return (
            <Card key={file.id} className={`group overflow-hidden bg-gradient-to-br ${tone.card} p-0`}>
              <div className={`h-2 bg-gradient-to-r ${tone.bar}`} />
              <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <span className={`grid size-14 shrink-0 place-items-center rounded-2xl shadow-sm ${tone.icon}`}>
                    <Icon className="size-7" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{identity.badge} {identity.label}</p>
                    <h3 className="mt-1 text-lg font-bold text-ink">{file.originalFileName}</h3>
                    <p className="mt-2 text-sm text-muted">{file.logicalFolder || 'Unassigned folder'}</p>
                  </div>
                </div>
                <span className="rounded-full bg-page px-3 py-1 text-xs font-bold uppercase text-muted">{file.visibility}</span>
              </div>
              {file.description ? <p className="mt-4 text-sm text-muted">{file.description}</p> : null}
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <span className="rounded-xl bg-page px-3 py-2 text-muted">Size: <b className="text-ink">{formatBytes(file.fileSize)}</b></span>
                <span className="rounded-xl bg-page px-3 py-2 text-muted">Week: <b className="text-ink">{file.weekNo || '-'}</b></span>
                <span className="rounded-xl bg-page px-3 py-2 text-muted">Usage: <b className="text-ink">{file.downloadCount} downloads / {file.viewCount} views</b></span>
                <span className="rounded-xl bg-page px-3 py-2 text-muted sm:col-span-3">Uploaded: <b className="text-ink">{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '-'}</b></span>
              </div>
              <div className="mt-4 border-t border-line pt-4">
                {fileActionButtons(file, true)}
              </div>
              </div>
            </Card>
          );})}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className={`overflow-hidden rounded-3xl border border-line bg-gradient-to-r ${ui.accent} p-6 shadow-sm ${viewMode === 'videos' ? 'text-white' : ''}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.22em] ${viewMode === 'videos' ? 'text-cyan-200' : 'text-primary'}`}>{ui.eyebrow}</p>
            <h2 className={`mt-2 text-2xl font-black ${viewMode === 'videos' ? 'text-white' : 'text-ink'}`}>{title}</h2>
            <p className={`mt-2 max-w-3xl text-sm ${viewMode === 'videos' ? 'text-slate-300' : 'text-muted'}`}>{description}</p>
          </div>
          <Button variant={viewMode === 'videos' ? 'ghost' : 'secondary'} className={viewMode === 'videos' ? 'bg-white/10 text-white hover:bg-white/20' : ''} onClick={loadData}>
            <FiRefreshCw />
            Refresh
          </Button>
        </div>
      </div>
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title={statLabels[0]} value={Number(stats?.summary?.totalFiles || 0).toLocaleString()} icon={viewMode === 'videos' ? FiVideo : viewMode === 'notes' ? FiFileText : viewMode === 'materials' ? FiBookOpen : FiFile} />
        <DashboardCard title={statLabels[1]} value={formatBytes(stats?.summary?.totalStorageUsed)} icon={FiArchive} />
        <DashboardCard title={statLabels[2]} value={stats?.recentUploads?.length || 0} icon={FiUploadCloud} />
        <DashboardCard title={statLabels[3]} value={formatBytes(stats?.summary?.averageFileSize)} icon={FiRefreshCw} />
      </div>

      <div className={`grid gap-6 ${viewMode === 'repository' ? 'xl:grid-cols-[1fr_24rem]' : 'xl:grid-cols-[minmax(18rem,0.75fr)_minmax(24rem,1fr)]'}`}>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">
            {viewMode === 'videos' ? 'Video Storage' : viewMode === 'notes' ? 'Notebook Storage' : viewMode === 'materials' ? 'Resource Storage by Type' : 'Storage by File Type'}
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byType || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="fileType" />
                <YAxis tickFormatter={formatBytes} />
                <Tooltip formatter={(value) => formatBytes(value)} />
                <Bar dataKey="storageUsed" radius={[8, 8, 0, 0]}>
                  {(stats?.byType || []).map((entry, index) => (
                    <Cell key={entry.fileType || index} fill={getFileTypeColor(entry.fileType, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">{ui.uploadTitle}</h2>
          <div className="mt-4 grid grid-cols-2 rounded-2xl border border-line bg-page p-1 text-sm font-bold">
            {[
              ['files', 'Learning files'],
              ['announcement', 'Announcement'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setUploadMode(mode);
                  setQueue([]);
                  setError('');
                  setMessage('');
                }}
                className={`min-h-10 rounded-xl transition ${uploadMode === mode ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
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
            <input type="file" className="sr-only" multiple accept={acceptedUploadTypes} onChange={selectedFiles} />
            <FiUploadCloud className="mx-auto size-8 text-primary" />
            <span className="mt-3 block text-sm font-bold text-ink">Drag, drop, or browse files</span>
            <span className="mt-1 block text-xs text-muted">{uploadHint}</span>
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={metadata.departmentId}
              onChange={(event) => updateMetadataField('departmentId', event.target.value)}
              className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <select
              value={metadata.curriculumId}
              onChange={(event) => updateMetadataField('curriculumId', event.target.value)}
              disabled={!metadata.departmentId}
              className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary disabled:bg-page disabled:text-muted"
            >
              <option value="">Select curriculum</option>
              {availableCurriculums.map((curriculum) => (
                <option key={curriculum.id} value={curriculum.id}>{curriculum.name}</option>
              ))}
            </select>
            <select
              value={metadata.courseId}
              onChange={(event) => updateMetadataField('courseId', event.target.value)}
              disabled={!metadata.curriculumId}
              className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary disabled:bg-page disabled:text-muted"
            >
              <option value="">Select subject/module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={metadata.weekNo}
              onChange={(event) => updateMetadataField('weekNo', event.target.value)}
              placeholder="Week number"
              className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            />
            <input
              value={metadata.topic}
              onChange={(event) => updateMetadataField('topic', event.target.value)}
              placeholder={uploadMode === 'announcement' ? 'Topic or short label' : 'Topic'}
              className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary sm:col-span-2"
            />
          </div>
          {uploadMode === 'announcement' ? (
            <input
              value={metadata.announcementTitle || ''}
              onChange={(event) => updateMetadataField('announcementTitle', event.target.value)}
              placeholder="Announcement title"
              className="mt-3 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            />
          ) : null}
          <textarea
            value={metadata.description}
            onChange={(event) => updateMetadataField('description', event.target.value)}
            placeholder={uploadMode === 'announcement' ? 'Announcement content' : 'Description'}
            className="mt-3 min-h-20 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {uploadMode === 'files' ? (
            <input
              value={metadata.versionNote || ''}
              onChange={(event) => updateMetadataField('versionNote', event.target.value)}
              placeholder="Version note"
              className="mt-3 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            />
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select value={metadata.visibility} onChange={(event) => updateMetadataField('visibility', event.target.value)} className="min-h-11 rounded-xl border border-line px-3 text-sm">
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="draft">Draft</option>
            </select>
            <select value={metadata.audience} onChange={(event) => updateMetadataField('audience', event.target.value)} className="min-h-11 rounded-xl border border-line px-3 text-sm">
              {audienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input value={metadata.tags} onChange={(event) => updateMetadataField('tags', event.target.value)} placeholder="Tags" className="min-h-11 rounded-xl border border-line px-3 text-sm sm:col-span-2" />
          </div>
          <p className="mt-3 text-xs font-semibold text-muted">
            {uploadMode === 'announcement'
              ? 'Announcements are scoped to the selected department, curriculum, and subject/module. Add a week number to place it inside that week; leave week empty to show it above all weeks.'
              : 'Files are scoped to the selected department, curriculum, subject/module, and week.'}
          </p>
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
            <Button disabled={uploadMode === 'files' && !queue.length} isLoading={isUploading} onClick={() => uploadQueue()}>
              {uploadMode === 'announcement' ? 'Publish Announcement' : 'Upload Queue'}
            </Button>
            <Button variant="secondary" disabled={!queue.some((item) => item.status === 'failed') || isUploading} onClick={() => uploadQueue(true)}>Retry Failed</Button>
            <Button variant="secondary" disabled={!queue.length || isUploading} onClick={() => setQueue([])}>Cancel Queue</Button>
            {versionTarget ? <Button variant="ghost" onClick={() => setVersionTarget(null)}>Clear Version Target</Button> : null}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className={`border-b border-line bg-gradient-to-r ${ui.accent} px-6 py-5 ${viewMode === 'videos' ? 'text-white' : ''}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${viewMode === 'videos' ? 'text-cyan-200' : 'text-primary'}`}>{ui.eyebrow}</p>
              <h2 className={`mt-1 text-xl font-bold ${viewMode === 'videos' ? 'text-white' : 'text-ink'}`}>{ui.searchTitle}</h2>
            </div>
            <p className={`text-sm font-semibold ${viewMode === 'videos' ? 'text-slate-300' : 'text-muted'}`}>{Number(files.total || 0).toLocaleString()} records</p>
          </div>
        </div>
        <div className="p-6">
          <label className="relative block">
            <FiSearch className="absolute left-5 top-1/2 size-6 -translate-y-1/2 text-primary" />
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder={ui.searchPlaceholder}
              className="min-h-16 w-full rounded-3xl border border-primary/20 bg-card pl-14 pr-5 text-base font-semibold text-ink shadow-[0_18px_45px_rgba(15,23,42,0.08)] outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {!lockFileType ? (
              <label className="rounded-2xl border border-line bg-page/70 p-3 shadow-sm">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted">File Type</span>
                <select value={filters.fileType} onChange={(event) => updateFilter('fileType', event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary">
                  <option value="">All Types</option>
                  {['pdf', 'ppt', 'documents', 'spreadsheets', 'archives', 'images', 'videos', 'audio'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
            ) : null}
            <label className="rounded-2xl border border-line bg-page/70 p-3 shadow-sm">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted">Visibility</span>
              <select value={filters.visibility} onChange={(event) => updateFilter('visibility', event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary">
                <option value="">Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label className="rounded-2xl border border-line bg-page/70 p-3 shadow-sm">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted">Audience</span>
              <select value={filters.audience || ''} onChange={(event) => updateFilter('audience', event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary">
                <option value="">Audience</option>
                {audienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="rounded-2xl border border-line bg-page/70 p-3 shadow-sm">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted">Status</span>
              <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary">
                <option value="">Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="draft">Draft</option>
                <option value="deleted">Deleted</option>
              </select>
            </label>
            <label className="rounded-2xl border border-line bg-page/70 p-3 shadow-sm">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted">Sort By</span>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
                <option value="largest">Largest</option>
                <option value="mostDownloaded">Most Downloaded</option>
                <option value="mostViewed">Most Viewed</option>
              </select>
            </label>
          </div>
          <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Advanced filters</p>
            <button
              type="button"
              onClick={() => setFilters(buildDefaultFilters(initialFilters))}
              className="text-xs font-bold text-primary transition hover:text-primary-dark"
            >
              Clear filters
            </button>
          </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
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
                  className="min-h-12 rounded-2xl border border-line bg-card px-4 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              ))}
              <input
                value={filters.minSize || ''}
                onChange={(event) => updateFilter('minSize', event.target.value)}
                placeholder="Min size bytes"
                className="min-h-12 rounded-2xl border border-line bg-card px-4 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <input
                value={filters.maxSize || ''}
                onChange={(event) => updateFilter('maxSize', event.target.value)}
                placeholder="Max size bytes"
                className="min-h-12 rounded-2xl border border-line bg-card px-4 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <input
                value={filters.dateFrom || ''}
                onChange={(event) => updateFilter('dateFrom', event.target.value)}
                type="date"
                className="min-h-12 rounded-2xl border border-line bg-card px-4 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <input
                value={filters.dateTo || ''}
                onChange={(event) => updateFilter('dateTo', event.target.value)}
                type="date"
                className="min-h-12 rounded-2xl border border-line bg-card px-4 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? <Loader label="Loading files" /> : null}
      {!isLoading && !fileItems.length ? <EmptyState title={ui.emptyTitle} description={ui.emptyDescription} /> : null}
      {!isLoading && fileItems.length ? (
        <>
          {viewMode === 'repository' ? (
            <Card className="p-4">
              <div className="overflow-hidden rounded-2xl border border-line bg-card">
                <div className="overflow-x-auto pt-2">
                <table className="min-w-full divide-y divide-line text-sm">
                  <thead className="bg-page text-left text-xs uppercase text-muted">
                    <tr>
                      {['File', 'Folder', 'Type', 'Size', 'Visibility', 'Audience', 'Usage', 'Actions'].map((heading) => (
                        <th key={heading} className="px-4 py-3">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {fileItems.map((file) => {
                      const identity = getFileIdentity(file);
                      const Icon = getFileTypeIcon(file);
                      const tone = getFileTypeTone(file);
                      return (
                      <tr key={file.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-bold text-ink">{file.originalFileName}</p>
                          <p className="mt-1 text-xs text-muted">{file.owner || 'System'} - Version {file.version}</p>
                        </td>
                        <td className="px-4 py-4 text-muted">{file.logicalFolder || '-'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${tone.icon}`}>
                            <Icon />
                            {identity.badge}
                          </span>
                        </td>
                        <td className="px-4 py-4">{formatBytes(file.fileSize)}</td>
                        <td className="px-4 py-4 capitalize">{file.visibility}</td>
                        <td className="px-4 py-4">{audienceLabels[file.audience || 'all'] || file.audience || 'All Users'}</td>
                        <td className="px-4 py-4 text-muted">{file.downloadCount} downloads / {file.viewCount} views</td>
                        <td className="px-4 py-4">{fileActionButtons(file, true)}</td>
                      </tr>
                    );})}
                  </tbody>
                </table>
                </div>
              </div>
            </Card>
          ) : renderSpecializedFiles()}
          <Card className="p-4">
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button>
              <span className="text-sm font-semibold text-muted">Page {filters.page} of {totalPages}</span>
              <Button variant="secondary" disabled={filters.page >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button>
            </div>
          </Card>
        </>
      ) : null}

      {previewUrl ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ink">Secure Preview</h2>
            <Button variant="secondary" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); setPreviewFileMeta(null); }}>Close</Button>
          </div>
          {getFileIdentity(previewFileMeta || {}).category === 'image' ? (
            <img src={previewUrl} alt={previewFileMeta.originalFileName} className="max-h-[32rem] w-full rounded-xl border border-line object-contain" />
          ) : null}
          {getFileIdentity(previewFileMeta || {}).category === 'video' ? (
            <video src={previewUrl} controls className="max-h-[32rem] w-full rounded-xl border border-line" />
          ) : null}
          {getFileIdentity(previewFileMeta || {}).category === 'audio' ? (
            <audio src={previewUrl} controls className="w-full rounded-xl border border-line p-4" />
          ) : null}
          {!['image', 'video', 'audio'].includes(getFileIdentity(previewFileMeta || {}).category) ? (
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
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Department</span>
            <select
              value={editForm.departmentId || ''}
              onChange={(event) => updateEditField('departmentId', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Keep current department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Curriculum</span>
            <select
              value={editForm.curriculumId || ''}
              onChange={(event) => updateEditField('curriculumId', event.target.value)}
              disabled={!editForm.departmentId}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary disabled:bg-page disabled:text-muted"
            >
              <option value="">Keep current curriculum</option>
              {availableEditCurriculums.map((curriculum) => (
                <option key={curriculum.id} value={curriculum.id}>{curriculum.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Subject / Module</span>
            <select
              value={editForm.courseId || ''}
              onChange={(event) => updateEditField('courseId', event.target.value)}
              disabled={!editForm.curriculumId}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary disabled:bg-page disabled:text-muted"
            >
              <option value="">Keep current subject/module</option>
              {editModules.map((module) => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Week</span>
            <input
              value={editForm.weekNo || ''}
              onChange={(event) => updateEditField('weekNo', event.target.value)}
              type="number"
              min="1"
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase text-muted">Topic</span>
            <input
              value={editForm.topic || ''}
              onChange={(event) => updateEditField('topic', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            />
          </label>
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
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Audience</span>
            <select
              value={editForm.audience}
              onChange={(event) => updateEditField('audience', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
            >
              {audienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
      <ConfirmationDialog
        open={Boolean(archiveTarget)}
        title="Delete file"
        message={`Delete ${archiveTarget?.originalFileName}? The database record and stored file will be removed.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setArchiveTarget(null)}
        onConfirm={removeFile}
      />
    </div>
  );
}
