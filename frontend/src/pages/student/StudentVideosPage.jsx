import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentVideos } from '../../data/studentData';

export function StudentVideosPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Videos" description="Watch uploaded videos, YouTube links, Vimeo links, and recorded lectures." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {studentVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="grid aspect-video place-items-center bg-slate-200 text-primary">Video Player</div>
            <div className="p-5">
              <h2 className="text-lg font-bold text-ink">{video.title}</h2>
              <p className="mt-2 text-sm text-muted">{video.teacher} · Week {video.week} · {video.duration}</p>
              <p className="mt-2 text-sm text-muted">{video.topic} · {video.type}</p>
              <Button className="mt-4">Watch Video</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
