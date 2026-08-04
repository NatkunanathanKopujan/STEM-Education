import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MaterialHierarchy } from '../../components/learning/MaterialHierarchy';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { notificationService } from '../../services/notificationService';
import { studentLearningService } from '../../services/studentLearningService';

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'PDF', value: 'pdf' },
  { label: 'PPT', value: 'ppt' },
  { label: 'Documents', value: 'documents' },
  { label: 'Spreadsheets', value: 'spreadsheets' },
  { label: 'ZIP / Archives', value: 'archives' },
  { label: 'Images', value: 'images' },
  { label: 'Videos', value: 'videos' },
  { label: 'Audio', value: 'audio' },
];

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'A-Z', value: 'az' },
  { label: 'Z-A', value: 'za' },
  { label: 'Most Downloaded', value: 'mostDownloaded' },
  { label: 'Most Viewed', value: 'mostViewed' },
];

export function StudentMaterialsPage() {
  const [items, setItems] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentLearningService.listMaterialsResult({
        search: query.trim(),
        fileType: filter,
        sort,
        page,
        limit: 20,
      });
      const announcementData = await notificationService.getAnnouncements({
        search: query.trim(),
        visibleOnly: true,
        status: 'published',
        sort: 'newest',
        limit: 100,
      }).catch(() => ({ announcements: [] }));
      setItems(data.materials || []);
      setAnnouncements(announcementData.announcements || []);
      setTotal(data.total || 0);
      setLimit(data.limit || 20);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load learning materials.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, query, sort]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [limit, total]);

  const updateQuery = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const updateFilter = (event) => {
    setFilter(event.target.value);
    setPage(1);
  };

  const updateSort = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const previewFile = async (id) => {
    const url = await studentLearningService.preview(id);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const viewAnnouncement = async (id) => {
    const details = await notificationService.getAnnouncement(id);
    setSelectedAnnouncement(details);
  };

  const previewAnnouncementAttachment = async (announcementId, attachment) => {
    const url = await notificationService.previewAnnouncementAttachment(announcementId, attachment.id);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Learning Materials" description="View, preview, search, and sort permitted PDFs, PPTs, DOCs, ZIP files, and images." />
      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <SearchBar value={query} onChange={updateQuery} placeholder="Search materials, topics, teachers, subjects" />
          <SelectBox value={filter} onChange={updateFilter} options={typeOptions} />
          <SelectBox value={sort} onChange={updateSort} options={sortOptions} />
          <Button variant="secondary" onClick={loadMaterials}>Refresh</Button>
        </div>
      </Card>
      {error ? <Card className="p-5 text-sm text-red-600">{error}</Card> : null}
      {loading ? <Card className="p-5 text-sm text-muted">Loading materials...</Card> : null}
      {!loading ? (
        <MaterialHierarchy
          items={items}
          announcements={announcements}
          emptyMessage="No learning materials found in the database."
          onPreview={previewFile}
          onViewAnnouncement={viewAnnouncement}
          onPreviewAttachment={previewAnnouncementAttachment}
          allowDownload={false}
        />
      ) : null}
      <Card className="flex items-center justify-end gap-3 p-4"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</Button><span className="text-sm font-semibold text-muted">Page {page} of {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></Card>
      <Modal
        open={Boolean(selectedAnnouncement)}
        title="Announcement"
        onClose={() => setSelectedAnnouncement(null)}
      >
        {selectedAnnouncement ? (
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-bold text-ink">{selectedAnnouncement.title}</h2>
            <p className="leading-6 text-muted">{selectedAnnouncement.content || selectedAnnouncement.description || 'No announcement details provided.'}</p>
            {selectedAnnouncement.attachments?.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedAnnouncement.attachments.map((attachment) => (
                  <button
                    key={attachment.id || attachment.filePath}
                    type="button"
                    onClick={() => previewAnnouncementAttachment(selectedAnnouncement.id, attachment)}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {attachment.fileName}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
