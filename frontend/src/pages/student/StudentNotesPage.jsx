import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentNotes } from '../../data/studentData';

export function StudentNotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Teacher Notes" description="Read rich teacher notes, download notes when allowed, and print if needed." />
      <div className="grid gap-5 lg:grid-cols-2">
        {studentNotes.map((note) => (
          <Card key={note.id} className="p-5">
            <h2 className="text-lg font-bold text-ink">{note.title}</h2>
            <p className="mt-2 text-sm text-muted">{note.teacher} · {note.topic}</p>
            <div className="mt-4 rounded-xl bg-page p-4 text-sm leading-6 text-ink">{note.body}</div>
            <div className="mt-4 flex gap-2"><Button variant="secondary">Download</Button><Button variant="secondary">Print</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
