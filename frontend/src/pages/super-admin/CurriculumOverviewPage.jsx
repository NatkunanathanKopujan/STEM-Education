import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { dashboardService } from '../../services/dashboardService';

export function CurriculumOverviewPage() {
  const [curriculums, setCurriculums] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardService
      .curriculums()
      .then((response) => {
        if (mounted) setCurriculums(response.curriculums || []);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCurriculums = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return curriculums.filter((item) => {
      const matchesQuery = Object.values(item).join(' ').toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [curriculums, query, statusFilter]);

  if (isLoading) {
    return <Loader label="Loading curriculums" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Curriculum Overview" description="Review real curriculum records, teacher coverage, students, subjects, and materials." />
      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search curriculums" />
          <SelectBox value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={[{ label: 'All Status', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Archived', value: 'Archived' }]} />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredCurriculums.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">Code: {item.code}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{item.description || 'No description added.'}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-page p-3"><p className="font-bold text-primary">{item.students}</p><p className="text-xs text-muted">Students</p></div>
              <div className="rounded-xl bg-page p-3"><p className="font-bold text-primary">{item.lessons}</p><p className="text-xs text-muted">Subjects</p></div>
              <div className="rounded-xl bg-page p-3"><p className="font-bold text-primary">{item.materials}</p><p className="text-xs text-muted">Materials</p></div>
            </div>
          </Card>
        ))}
      </div>
      {!filteredCurriculums.length ? (
        <EmptyState title="No curriculums found" description="Only curriculums stored in the database will appear here." />
      ) : null}
    </div>
  );
}
