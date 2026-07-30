import { useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiBell,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiFileText,
  FiFolder,
  FiLayers,
  FiVideo,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

function toAnnouncementItem(announcement) {
  return {
    ...announcement,
    id: `announcement-${announcement.id}`,
    rawId: announcement.id,
    kind: 'announcement',
    title: announcement.title,
    topic: announcement.description,
    type: 'ANNOUNCEMENT',
    teacher: 'Announcement',
    department: announcement.departmentName || 'Unassigned Department',
    curriculum: announcement.curriculumName || 'Unassigned Curriculum',
    subject: announcement.subjectName || 'Unassigned Subject',
    weekNo: announcement.weekNo,
    attachments: announcement.attachments || [],
  };
}

function getWeekName(item) {
  if (item.kind === 'announcement' && !item.weekNo) return 'Subject Announcements';
  if (item.weekNo) return `Week ${item.weekNo}`;
  return item.week || 'Week not set';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!size) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(item) {
  const type = String(item.fileType || item.type || '').toLowerCase();
  if (item.kind === 'announcement') return FiBell;
  if (type.includes('video')) return FiVideo;
  return FiFileText;
}

function sortWeeks(a, b) {
  if (a.weekName === 'Subject Announcements') return -1;
  if (b.weekName === 'Subject Announcements') return 1;
  return Number(a.weekName.replace(/\D/g, '') || 0) - Number(b.weekName.replace(/\D/g, '') || 0);
}

function groupMaterials(items = [], announcements = []) {
  const departments = new Map();

  [...items, ...announcements.map(toAnnouncementItem)].forEach((item) => {
    const departmentName = item.department || 'Unassigned Department';
    const curriculumName = item.curriculum || 'Unassigned Curriculum';
    const subjectName = item.subject || 'Unassigned Subject';
    const weekName = getWeekName(item);

    if (!departments.has(departmentName)) {
      departments.set(departmentName, new Map());
    }
    const curriculums = departments.get(departmentName);

    if (!curriculums.has(curriculumName)) {
      curriculums.set(curriculumName, new Map());
    }
    const subjects = curriculums.get(curriculumName);

    if (!subjects.has(subjectName)) {
      subjects.set(subjectName, new Map());
    }
    const weeks = subjects.get(subjectName);

    if (!weeks.has(weekName)) {
      weeks.set(weekName, []);
    }
    weeks.get(weekName).push(item);
  });

  return [...departments.entries()].map(([departmentName, curriculums]) => ({
    departmentName,
    curriculums: [...curriculums.entries()].map(([curriculumName, subjects]) => ({
      curriculumName,
      subjects: [...subjects.entries()].map(([subjectName, weeks]) => ({
        subjectName,
        weeks: [...weeks.entries()].map(([weekName, files]) => ({ weekName, files })).sort(sortWeeks),
      })),
    })),
  }));
}

function AttachmentLinks({ attachments = [] }) {
  if (!attachments.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id || attachment.filePath}
          href={attachment.filePath}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-primary hover:border-primary"
        >
          {attachment.fileName}
        </a>
      ))}
    </div>
  );
}

function countFiles(curriculum) {
  return curriculum.subjects.reduce(
    (total, subject) => total + subject.weeks.reduce((weekTotal, week) => weekTotal + week.files.length, 0),
    0,
  );
}

function countSubjectFiles(subject) {
  return subject.weeks.reduce((total, week) => total + week.files.length, 0);
}

function CourseTile({ icon: Icon, title, subtitle, meta, onClick, tone = 0 }) {
  const tones = [
    'from-slate-200 via-slate-100 to-white',
    'from-sky-200 via-cyan-100 to-white',
    'from-emerald-200 via-teal-100 to-white',
    'from-violet-200 via-purple-100 to-white',
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-xl border border-line bg-card text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className={`h-28 bg-gradient-to-br ${tones[tone % tones.length]} p-5`}>
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

export function MaterialHierarchy({
  items,
  announcements = [],
  emptyMessage,
  onPreview,
  onDownload,
  onViewAnnouncement,
  allowDownload = true,
}) {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const grouped = useMemo(() => groupMaterials(items, announcements), [announcements, items]);
  const department = grouped.find((item) => item.departmentName === selectedDepartment);
  const curriculum = department?.curriculums.find((item) => item.curriculumName === selectedCurriculum);
  const subject = curriculum?.subjects.find((item) => item.subjectName === selectedSubject);

  const goDepartments = () => {
    setSelectedDepartment('');
    setSelectedCurriculum('');
    setSelectedSubject('');
  };

  const goCurriculums = () => {
    setSelectedCurriculum('');
    setSelectedSubject('');
  };

  const goSubjects = () => {
    setSelectedSubject('');
  };

  if (!items?.length && !announcements?.length) {
    return <Card className="p-5 text-sm text-muted">{emptyMessage}</Card>;
  }

  const generalAnnouncementWeek = subject?.weeks.find((week) => week.weekName === 'Subject Announcements');
  const weekSections = subject?.weeks.filter((week) => week.weekName !== 'Subject Announcements') || [];

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Learning Content</h2>
          <p className="mt-1 text-sm text-muted">Open your department, curriculum, subject, and week-wise uploaded files and announcements.</p>
        </div>
        {(selectedDepartment || selectedCurriculum || selectedSubject) ? (
          <Button variant="secondary" onClick={selectedSubject ? goSubjects : selectedCurriculum ? goCurriculums : goDepartments}>
            <FiArrowLeft />
            Back
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <BreadcrumbButton active={!selectedDepartment} onClick={goDepartments}>Departments</BreadcrumbButton>
        {selectedDepartment ? (
          <>
            <FiChevronRight className="text-muted" />
            <BreadcrumbButton active={!selectedCurriculum} onClick={goCurriculums}>{selectedDepartment}</BreadcrumbButton>
          </>
        ) : null}
        {selectedCurriculum ? (
          <>
            <FiChevronRight className="text-muted" />
            <BreadcrumbButton active={!selectedSubject} onClick={goSubjects}>{selectedCurriculum}</BreadcrumbButton>
          </>
        ) : null}
        {selectedSubject ? (
          <>
            <FiChevronRight className="text-muted" />
            <BreadcrumbButton active>{selectedSubject}</BreadcrumbButton>
          </>
        ) : null}
      </div>

      {!selectedDepartment ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((departmentItem, index) => (
            <CourseTile
              key={departmentItem.departmentName}
              icon={FiFolder}
              title={departmentItem.departmentName}
              subtitle={`${departmentItem.curriculums.length} curriculums`}
              meta={`${departmentItem.curriculums.reduce((total, item) => total + countFiles(item), 0)} items`}
              tone={index}
              onClick={() => setSelectedDepartment(departmentItem.departmentName)}
            />
          ))}
        </div>
      ) : null}

      {selectedDepartment && !selectedCurriculum ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {department?.curriculums.map((curriculumItem, index) => (
            <CourseTile
              key={curriculumItem.curriculumName}
              icon={FiLayers}
              title={curriculumItem.curriculumName}
              subtitle={`${curriculumItem.subjects.length} subjects/modules`}
              meta={`${countFiles(curriculumItem)} items`}
              tone={index}
              onClick={() => setSelectedCurriculum(curriculumItem.curriculumName)}
            />
          ))}
        </div>
      ) : null}

      {selectedCurriculum && !selectedSubject ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {curriculum?.subjects.map((subjectItem, index) => (
            <CourseTile
              key={subjectItem.subjectName}
              icon={FiBookOpen}
              title={subjectItem.subjectName}
              subtitle={`${subjectItem.weeks.length} week sections`}
              meta={`${countSubjectFiles(subjectItem)} items`}
              tone={index}
              onClick={() => setSelectedSubject(subjectItem.subjectName)}
            />
          ))}
        </div>
      ) : null}

      {subject ? (
        <div className="mt-5">
          <div className="rounded-xl border border-line bg-page p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{selectedDepartment} / {selectedCurriculum}</p>
            <h3 className="mt-2 text-2xl font-bold text-ink">{subject.subjectName}</h3>
            <p className="mt-1 text-sm text-muted">{countSubjectFiles(subject)} uploaded items available.</p>
          </div>

          {generalAnnouncementWeek?.files?.length ? (
            <div className="mt-5 space-y-3">
              <h4 className="text-base font-bold text-ink">Subject Announcements</h4>
              {generalAnnouncementWeek.files.map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <p className="flex items-center gap-2 font-bold text-ink"><FiBell className="text-primary" />{announcement.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{announcement.topic || 'Announcement'}</p>
                  <AttachmentLinks attachments={announcement.attachments} />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-muted">{formatDate(announcement.createdAt || announcement.publishedAt)}</span>
                    <Button variant="secondary" className="min-h-9 px-3" onClick={() => onViewAnnouncement?.(announcement.rawId)}>
                      <FiEye />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {weekSections.map((week) => {
              const weekKey = `${selectedDepartment}-${selectedCurriculum}-${subject.subjectName}-${week.weekName}`;
              const isOpen = expandedWeeks[weekKey] ?? true;
              return (
                <div key={week.weekName} className="overflow-hidden rounded-xl border border-line bg-page">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    onClick={() => setExpandedWeeks((current) => ({ ...current, [weekKey]: !isOpen }))}
                  >
                    <span className="flex items-center gap-3 text-lg font-bold text-ink">
                      <span className="flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm">
                        {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                      {week.weekName} ({week.files.length} {week.files.length === 1 ? 'File' : 'Files'})
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="divide-y divide-line bg-card px-5">
                      {!week.files.length ? <p className="py-4 text-sm text-muted">No learning materials uploaded for this week.</p> : null}
                      {week.files.map((file) => {
                        const Icon = getFileIcon(file);
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
                                {file.topic || '-'} - {file.teacher || '-'} - {file.type || 'FILE'} - {formatFileSize(file.size || file.fileSize)}
                              </p>
                              <p className="ml-13 mt-1 text-xs text-muted">{formatDate(file.createdAt || file.uploadedAt || file.uploadDate)}</p>
                              {file.kind === 'announcement' ? <AttachmentLinks attachments={file.attachments} /> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {file.kind === 'announcement' ? (
                                <Button variant="secondary" className="min-h-9 px-3" onClick={() => onViewAnnouncement?.(file.rawId)}>
                                  <FiEye />
                                  View
                                </Button>
                              ) : (
                                <>
                                  <Button variant="secondary" className="min-h-9 px-3" onClick={() => onPreview(file.id)}>
                                    <FiEye />
                                    View
                                  </Button>
                                  {allowDownload ? (
                                    <Button className="min-h-9 px-3" onClick={() => onDownload(file)}>
                                      <FiDownload />
                                      Download
                                    </Button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!weekSections.length ? (
              <div className="rounded-xl border border-dashed border-line bg-page p-5 text-sm text-muted">No learning materials uploaded for this week.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
