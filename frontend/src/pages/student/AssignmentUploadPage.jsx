import { useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/FormControls';

export function AssignmentUploadPage() {
  const [progress, setProgress] = useState(0);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Assignment Video Upload" description="Upload assignment, presentation, or practical demonstration videos in MP4, MOV, or AVI format." />
      <Card className="p-6">
        <form className="grid gap-5 md:grid-cols-2">
          <Input label="Assignment Title" />
          <Input label="Week Number" type="number" />
          <Textarea label="Description" className="md:col-span-2" />
          <FileUpload label="Upload Video" helperText="MP4, MOV, or AVI" accept="video/mp4,video/quicktime,video/x-msvideo" />
          <div className="rounded-xl border border-line bg-page p-4"><p className="text-sm font-semibold text-ink">Upload Progress</p><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-muted">Submission Status: {progress === 100 ? 'Submitted' : 'Draft'}</p></div>
          <div className="flex justify-end md:col-span-2"><Button type="button" onClick={() => setProgress(100)}>Submit Assignment</Button></div>
        </form>
      </Card>
    </div>
  );
}
