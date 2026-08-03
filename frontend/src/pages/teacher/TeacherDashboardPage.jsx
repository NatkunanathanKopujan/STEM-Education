import { useCallback, useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiFileText,
  FiFolder,
  FiImage,
  FiLayers,
  FiMusic,
  FiPackage,
  FiVideo,
} from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { TeacherStatCard } from '../../components/teacher/TeacherStatCard';
import { ErrorAlert } from '../../components/ui/Alerts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { fileService } from '../../services/fileService';
import { teacherLearningService } from '../../services/teacherLearningService';
import { countAxisDomain, getChartColor } from '../../utils/chartTheme';
import { getFileIdentity } from '../../utils/fileTypes';

function formatActivityDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWeek(weekNo) {
  const value = Number(weekNo || 0);
  if (!value) return 'General';
  return `Week ${String(value).padStart(2, '0')}`;
}

function getFileIcon(file) {
  const identity = getFileIdentity(file);
  if (file?.kind === 'announcement' || String(file?.fileType || '').toLowerCase().includes('announcement')) return FiBell;
  if (identity.category === 'video') return FiVideo;
  if (identity.category === 'image') return FiImage;
  if (identity.category === 'audio') return FiMusic;
  if (identity.category === 'archive') return FiPackage;
  if (identity.category === 'presentation') return FiLayers;
  if (identity.category === 'spreadsheet') return FiBarChart2;
  if (identity.category === 'pdf' || identity.category === 'word' || identity.category === 'text') return FiFileText;
  return FiFileText;
}

function CourseTile({ icon: Icon, title, subtitle, meta, onClick, tone = 0 }) {
  const tones = [
    'from-slate-200 via-slate-100 to-white',
    'from-sky-200 via-blue-100 to-white',
    'from-emerald-200 via-teal-100 to-white',
    'from-violet-200 via-purple-100 to-white',
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-xl border border-line bg-card text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className={`h-32 bg-gradient-to-br ${tones[tone % tones.length]} p-5`}>
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
          <Icon className="size-6" />
        </div>
      </div>
      <div className="space-y-2 p-5">
        <h3 className="line-clamp-2 text-base font-bold text-ink">{title}</h3>
        <p className="min-h-5 text-sm text-muted">{subtitle}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{meta}</p>
      </div>
    </button>
  );
}

function BreadcrumbButton({ children, onClick, active }) {
  if (active) return <span className="font-semibold text-ink">{children}</span>;
  return (
    <button type="button" className="text-muted transition hover:text-primary" onClick={onClick}>
      {children}
    </button>
  );
}

export function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState({ stats: [], weeklyAnalytics: [], announcements: [], activity: [] });
  const [courseTree, setCourseTree] = useState([]);
  const [contentError, setContentError] = useState('');
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await teacherLearningService.getDashboard());
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourseContent = useCallback(async () => {
    setContentLoading(true);
    setContentError('');
    try {
      const hierarchy = await teacherLearningService.getLearningHierarchy();
      setCourseTree(hierarchy?.departments || []);
    } catch (loadError) {
      setContentError(loadError?.response?.data?.message || loadError?.message || 'Unable to load course content.');
    } finally {
      setContentLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([loadDashboard(), loadCourseContent()]);
  }, [loadCourseContent, loadDashboard]);

  useEffect(() => {
    loadDashboard();
    loadCourseContent();
  }, [loadCourseContent, loadDashboard]);
  const department = courseTree.find((item) => item.name === selectedDepartment);
  const curriculum = department?.curriculums.find((item) => item.name === selectedCurriculum);
  const subject = curriculum?.subjects.find((item) => item.name === selectedSubject);

  const handleBackToDepartments = () => {
    setSelectedDepartment('');
    setSelectedCurriculum('');
    setSelectedSubject('');
  };

  const handleBackToCurriculums = () => {
    setSelectedCurriculum('');
    setSelectedSubject('');
  };

  const handleBackToSubjects = () => {
    setSelectedSubject('');
  };

  const toggleWeek = (weekKey) => {
    setExpandedWeeks((current) => ({ ...current, [weekKey]: !current[weekKey] }));
  };

  const handlePreview = async (file) => {
    try {
      const url = await fileService.previewBlob(file.rawId);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (previewError) {
      setContentError(previewError?.response?.data?.message || previewError?.message || 'Unable to open file.');
    }
  };

  const handleDownload = async (file) => {
    try {
      const blob = await fileService.downloadBlob(file.rawId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setContentError(downloadError?.response?.data?.message || downloadError?.message || 'Unable to download file.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader eyebrow="Teacher" title="Teacher Dashboard" description="Manage learning content, weekly plans, completed topics, student progress, and AI quiz-ready resources." />
        <Button variant="secondary" onClick={refreshDashboard} isLoading={loading || contentLoading}>
          Refresh
        </Button>
      </div>
      <ErrorAlert message={error} />
      <ErrorAlert message={contentError} />
      {loading ? <Card className="p-5 text-sm text-muted">Loading teacher dashboard...</Card> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dashboard.stats.map((stat) => <TeacherStatCard key={stat.title} {...stat} />)}</div>
      <Card className="p-5">
        <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">My Teaching Courses</h2>
            <p className="mt-1 text-sm text-muted">Browse assigned departments, curriculums, subjects, announcements, and week-wise materials.</p>
          </div>
          {(selectedDepartment || selectedCurriculum || selectedSubject) ? (
            <Button variant="secondary" onClick={selectedSubject ? handleBackToSubjects : selectedCurriculum ? handleBackToCurriculums : handleBackToDepartments}>
              <FiArrowLeft />
              Back
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <BreadcrumbButton active={!selectedDepartment} onClick={handleBackToDepartments}>Departments</BreadcrumbButton>
          {selectedDepartment ? (
            <>
              <FiChevronRight className="text-muted" />
              <BreadcrumbButton active={!selectedCurriculum} onClick={handleBackToCurriculums}>{selectedDepartment}</BreadcrumbButton>
            </>
          ) : null}
          {selectedCurriculum ? (
            <>
              <FiChevronRight className="text-muted" />
              <BreadcrumbButton active={!selectedSubject} onClick={handleBackToSubjects}>{selectedCurriculum}</BreadcrumbButton>
            </>
          ) : null}
          {selectedSubject ? (
            <>
              <FiChevronRight className="text-muted" />
              <BreadcrumbButton active>{selectedSubject}</BreadcrumbButton>
            </>
          ) : null}
        </div>

        {contentLoading ? <div className="mt-5 rounded-xl border border-dashed border-line bg-page p-5 text-sm text-muted">Loading teaching course content...</div> : null}

        {!contentLoading && !courseTree.length ? (
          <div className="mt-5 rounded-xl border border-dashed border-line bg-page p-8 text-center text-sm text-muted">
            No learning materials or announcements are available for your assigned teaching scope yet.
          </div>
        ) : null}

        {!contentLoading && !selectedDepartment ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courseTree.map((item, index) => (
              <CourseTile
                key={item.name}
                icon={FiFolder}
                title={item.name}
                subtitle={`${item.curriculums.length} curriculums`}
                meta={`${item.fileCount} files / ${item.announcementCount} announcements`}
                tone={index}
                onClick={() => setSelectedDepartment(item.name)}
              />
            ))}
          </div>
        ) : null}

        {!contentLoading && selectedDepartment && !selectedCurriculum ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {department?.curriculums.map((item, index) => (
              <CourseTile
                key={item.name}
                icon={FiLayers}
                title={item.name}
                subtitle={`${item.subjects.length} subjects/modules`}
                meta={`${item.fileCount} files / ${item.announcementCount} announcements`}
                tone={index}
                onClick={() => setSelectedCurriculum(item.name)}
              />
            ))}
          </div>
        ) : null}

        {!contentLoading && selectedCurriculum && !selectedSubject ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {curriculum?.subjects.map((item, index) => (
              <CourseTile
                key={item.name}
                icon={FiBookOpen}
                title={item.name}
                subtitle={`${item.weeks.length} week sections`}
                meta={`${item.fileCount} files / ${item.announcementCount} announcements`}
                tone={index}
                onClick={() => setSelectedSubject(item.name)}
              />
            ))}
          </div>
        ) : null}

        {!contentLoading && subject ? (
          <div className="mt-5">
            <div className="rounded-xl border border-line bg-page p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{selectedDepartment} / {selectedCurriculum}</p>
              <h3 className="mt-2 text-2xl font-bold text-ink">{subject.name}</h3>
              <p className="mt-1 text-sm text-muted">{subject.fileCount} files and {subject.announcementCount} announcements available.</p>
            </div>

            {subject.generalAnnouncements.length ? (
              <div className="mt-5 space-y-3">
                <h4 className="text-base font-bold text-ink">Subject Announcements</h4>
                {subject.generalAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <p className="flex items-center gap-2 font-bold text-ink"><FiBell className="text-primary" />{announcement.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{announcement.content || 'No announcement details provided.'}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-muted">{formatActivityDate(announcement.uploadedAt)}</span>
                      <Button variant="secondary" className="min-h-9 px-3" onClick={() => setSelectedAnnouncement(announcement)}>
                        <FiEye />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {subject.weeks.map((week) => {
                const weekKey = `${selectedDepartment}-${selectedCurriculum}-${subject.name}-${week.weekNo}`;
                const isOpen = expandedWeeks[weekKey] ?? true;
                const itemCount = week.files.length + week.announcements.length;
                return (
                  <div key={weekKey} className="overflow-hidden rounded-xl border border-line bg-page">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                      onClick={() => toggleWeek(weekKey)}
                    >
                      <span className="flex items-center gap-3 text-lg font-bold text-ink">
                        <span className="flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm">
                          {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                        </span>
                        {formatWeek(week.weekNo)} ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="divide-y divide-line bg-card px-5">
                        {!itemCount ? <p className="py-4 text-sm text-muted">No learning materials uploaded for this week.</p> : null}
                        {week.announcements.map((announcement) => (
                          <div key={announcement.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="flex items-center gap-2 font-semibold text-ink"><FiBell className="text-primary" />{announcement.title}</p>
                              <p className="mt-1 text-sm text-muted">{announcement.content || 'Announcement'}</p>
                              <p className="mt-1 text-xs text-muted">{formatActivityDate(announcement.uploadedAt)}</p>
                            </div>
                            <Button variant="secondary" className="min-h-9 px-3" onClick={() => setSelectedAnnouncement(announcement)}>
                              <FiEye />
                              View
                            </Button>
                          </div>
                        ))}
                        {week.files.map((file) => {
                          const Icon = getFileIcon(file);
                          const identity = getFileIdentity(file);
                          return (
                            <div key={file.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="flex items-center gap-3 font-semibold text-ink">
                                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon />
                                  </span>
                                  {file.title}
                                </p>
                                <p className="ml-13 mt-1 text-sm text-muted">
                                  {file.topic || file.description || 'Learning material'} - {identity.label} - {formatFileSize(file.size || file.fileSize)} - Version {file.version}
                                </p>
                                <p className="ml-13 mt-1 text-xs text-muted">{formatActivityDate(file.uploadedAt)}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" className="min-h-9 px-3" onClick={() => handlePreview(file)}>
                                  <FiEye />
                                  View
                                </Button>
                                <Button className="min-h-9 px-3" onClick={() => handleDownload(file)}>
                                  <FiDownload />
                                  Download
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!subject.weeks.length ? <div className="rounded-xl border border-dashed border-line bg-page p-5 text-sm text-muted">No learning materials uploaded for this week.</div> : null}
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Quiz Attempts</h2>
          <div className="mt-5 h-80">
            {dashboard.weeklyAnalytics.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.weeklyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="weekNo" />
                  <YAxis allowDecimals={false} domain={countAxisDomain} />
                  <Tooltip />
                  <Bar dataKey="quizAttempts" fill={getChartColor(2)} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line bg-page text-sm font-medium text-muted">
                No quiz attempt data available yet.
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Announcements</h2><div className="mt-4 space-y-3">{dashboard.announcements.slice(0, 3).map((item) => <p key={item.id} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">{item.title}</p>)}{!dashboard.announcements.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No announcements published yet.</p> : null}</div></Card>
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Student Activity</h2><div className="mt-4 space-y-3">{dashboard.activity.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl bg-page p-3 text-sm"><p className="font-semibold text-ink">{item.studentName} completed Quiz {item.quizNumber}</p><p className="mt-1 text-muted">{item.subject} - {item.percentage}% {item.passStatus ? `(${item.passStatus})` : ''}</p><p className="mt-1 text-xs text-muted">{formatActivityDate(item.activityDate)}</p></div>)}{!dashboard.activity.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No graded quiz activity yet.</p> : null}</div></Card>
        </div>
      </div>
      <Modal open={Boolean(selectedAnnouncement)} title={selectedAnnouncement?.title || 'Announcement'} onClose={() => setSelectedAnnouncement(null)}>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted">{selectedAnnouncement?.content || 'No announcement details provided.'}</p>
          <p className="text-xs text-muted">{formatActivityDate(selectedAnnouncement?.uploadedAt)}</p>
          {selectedAnnouncement?.attachments?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-ink">Attachments</p>
              {selectedAnnouncement.attachments.map((attachment) => (
                <a
                  key={attachment.id || attachment.filePath}
                  href={attachment.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm font-semibold text-primary hover:border-primary"
                >
                  <span>{attachment.fileName || 'Attachment'}</span>
                  <FiDownload />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
