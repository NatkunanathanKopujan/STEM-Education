import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { studentMaterials } from '../../data/studentData';
import { useStudentCollection } from '../../hooks/useStudentCollection';

export function StudentMaterialsPage() {
  const state = useStudentCollection(studentMaterials);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Learning Materials" description="View, preview, search, sort, and download PDFs, PPTs, DOCs, ZIP files, and images." />
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_180px]"><SearchBar value={state.query} onChange={(e) => state.setQuery(e.target.value)} placeholder="Search materials" /><SelectBox value={state.filter} onChange={(e) => state.setFilter(e.target.value)} options={[{ label: 'All Types', value: 'All' }, { label: 'PDF', value: 'PDF' }, { label: 'PPTX', value: 'PPTX' }, { label: 'DOCX', value: 'DOCX' }]} /></div></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Title', 'Teacher', 'Week', 'Topic', 'Type', 'Upload Date', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{state.filteredItems.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold text-ink">{item.title}</td><td className="px-4 py-3 text-muted">{item.teacher}</td><td className="px-4 py-3">{item.week}</td><td className="px-4 py-3 text-muted">{item.topic}</td><td className="px-4 py-3">{item.type}</td><td className="px-4 py-3 text-muted">{item.uploadDate}</td><td className="px-4 py-3"><div className="flex gap-2"><Button variant="secondary">Preview</Button><Button>Download</Button></div></td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
