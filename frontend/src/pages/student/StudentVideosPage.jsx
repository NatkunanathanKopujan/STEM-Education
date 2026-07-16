import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentLearningService } from '../../services/studentLearningService';

export function StudentVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVideos(await studentLearningService.listVideos());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load videos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const watchVideo = async (id) => {
    const url = await studentLearningService.preview(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Videos" description="Watch uploaded video lessons from the database." />
      {error ? <Card className="p-5 text-sm text-red-600">{error}</Card> : null}
      {loading ? <Card className="p-5 text-sm text-muted">Loading videos...</Card> : null}
      {!loading && !videos.length ? <Card className="p-5 text-sm text-muted">No public videos found in the database.</Card> : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="grid aspect-video place-items-center bg-slate-200 text-primary">Uploaded Video</div>
            <div className="p-5">
              <h2 className="text-lg font-bold text-ink">{video.title}</h2>
              <p className="mt-2 text-sm text-muted">{video.teacher} - {video.week}</p>
              <p className="mt-2 text-sm text-muted">{video.topic} - {video.type}</p>
              <Button className="mt-4" onClick={() => watchVideo(video.id)}>Watch Video</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
