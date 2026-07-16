import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { fileService } from '../../services/fileService';

export function LearningMaterialsOverviewPage() {
  const [statistics, setStatistics] = useState({ byType: [], recentUploads: [] });
  const [loading, setLoading] = useState(true);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      setStatistics(await fileService.statistics());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Learning Materials Overview" description="Review learning material statistics and recently uploaded files from the database." />
      {loading ? <Card className="p-5 text-sm text-muted">Loading material statistics...</Card> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {(statistics.byType || []).map((item) => (
          <Card key={item.fileType} className="p-5">
            <p className="text-sm font-semibold text-muted">Total {item.fileType}</p>
            <p className="mt-3 text-3xl font-bold text-primary">{item.totalFiles}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Recently Uploaded Materials</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(statistics.recentUploads || []).map((item) => (
            <p key={item.id} className="rounded-xl border border-line bg-page p-4 text-sm font-semibold text-ink">{item.originalFileName || item.fileName}</p>
          ))}
          {!loading && !(statistics.recentUploads || []).length ? <p className="rounded-xl border border-line bg-page p-4 text-sm text-muted">No uploaded materials found.</p> : null}
        </div>
      </Card>
    </div>
  );
}
