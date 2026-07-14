import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { materialStats } from '../../data/adminData';

const recentMaterials = [
  'Introduction to Algorithms.pdf',
  'Marketing Strategy Week 3.ppt',
  'Data Science Lab Notes.docx',
  'English Speaking Practice.mp4',
];

export function LearningMaterialsOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Learning Materials Overview" description="Review learning material statistics and recently uploaded files. Uploading is handled by teachers." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {materialStats.map((item) => (
          <Card key={item.type} className="p-5">
            <p className="text-sm font-semibold text-muted">Total {item.type}</p>
            <p className="mt-3 text-3xl font-bold text-primary">{item.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Recently Uploaded Materials</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentMaterials.map((item) => (
            <p key={item} className="rounded-xl border border-line bg-page p-4 text-sm font-semibold text-ink">{item}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}
