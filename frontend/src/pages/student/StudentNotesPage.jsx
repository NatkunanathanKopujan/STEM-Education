import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentLearningService } from '../../services/studentLearningService';

export function StudentNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setNotes(await studentLearningService.listNotes());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load teacher notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const downloadNote = async (note) => {
    const blob = await studentLearningService.download(note.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = note.title;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printNote = async (id) => {
    const url = await studentLearningService.preview(id);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
    printWindow?.addEventListener('load', () => printWindow.print(), { once: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Teacher Notes" description="Read and download teacher notes stored in the database." />
      {error ? <Card className="p-5 text-sm text-red-600">{error}</Card> : null}
      {loading ? <Card className="p-5 text-sm text-muted">Loading notes...</Card> : null}
      {!loading && !notes.length ? <Card className="p-5 text-sm text-muted">No public teacher notes found in the database.</Card> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {notes.map((note) => (
          <Card key={note.id} className="p-5">
            <h2 className="text-lg font-bold text-ink">{note.title}</h2>
            <p className="mt-2 text-sm text-muted">{note.teacher} - {note.topic}</p>
            <div className="mt-4 rounded-xl bg-page p-4 text-sm leading-6 text-ink">
              {note.description || `${note.subject} ${note.week}`}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => downloadNote(note)}>Download</Button>
              <Button variant="secondary" onClick={() => printNote(note.id)}>Print</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
