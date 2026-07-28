import { useMemo } from 'react';
import { FiDownload, FiEye } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

function groupMaterials(items = []) {
  const departments = new Map();

  items.forEach((item) => {
    const departmentName = item.department || 'Unassigned Department';
    const curriculumName = item.curriculum || 'Unassigned Curriculum';
    const subjectName = item.subject || 'Unassigned Subject';
    const weekName = item.weekNo ? `Week ${item.weekNo}` : item.week || 'Week not set';

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
        weeks: [...weeks.entries()].map(([weekName, files]) => ({ weekName, files })),
      })),
    })),
  }));
}

export function MaterialHierarchy({ items, emptyMessage, onPreview, onDownload }) {
  const grouped = useMemo(() => groupMaterials(items), [items]);

  if (!items?.length) {
    return <Card className="p-5 text-sm text-muted">{emptyMessage}</Card>;
  }

  return (
    <div className="space-y-5">
      {grouped.map((department) => (
        <Card key={department.departmentName} className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Department</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{department.departmentName}</h2>
          <div className="mt-4 space-y-4">
            {department.curriculums.map((curriculum) => (
              <div key={curriculum.curriculumName} className="rounded-2xl border border-line bg-page/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Curriculum</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{curriculum.curriculumName}</h3>
                <div className="mt-4 space-y-3">
                  {curriculum.subjects.map((subject) => (
                    <div key={subject.subjectName} className="rounded-xl border border-line bg-card p-4">
                      <p className="font-bold text-ink">{subject.subjectName}</p>
                      <div className="mt-3 space-y-3">
                        {subject.weeks.map((week) => (
                          <div key={week.weekName} className="rounded-xl bg-page p-3">
                            <p className="text-sm font-bold text-primary">{week.weekName}</p>
                            <div className="mt-2 divide-y divide-line rounded-xl border border-line bg-card">
                              {week.files.map((file) => (
                                <div key={file.id} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="font-semibold text-ink">{file.title}</p>
                                    <p className="mt-1 text-xs text-muted">
                                      {file.topic || '-'} · {file.teacher || '-'} · {file.type || 'FILE'}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="secondary" className="min-h-9 px-3" onClick={() => onPreview(file.id)}>
                                      <FiEye />
                                      View
                                    </Button>
                                    <Button className="min-h-9 px-3" onClick={() => onDownload(file)}>
                                      <FiDownload />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
