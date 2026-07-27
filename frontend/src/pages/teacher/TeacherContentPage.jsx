import { FileManagerPage } from '../files/FileManagerPage';
import { AnnouncementCenterPage } from '../notifications/AnnouncementCenterPage';

const pageConfig = {
  material: {
    title: 'Learning Materials',
    description:
      'Upload, preview, download, update, version, and archive learning materials from live database records.',
    initialFilters: {},
  },
  video: {
    title: 'Videos',
    description:
      'Manage uploaded video lessons with secure previews, downloads, version history, and database-backed access.',
    initialFilters: { fileType: 'videos' },
    lockFileType: true,
  },
  note: {
    title: 'Teacher Notes',
    description:
      'Manage notes and document resources with secure previews, downloads, version history, and database-backed access.',
    initialFilters: { fileType: 'pdf,documents' },
    lockFileType: true,
  },
};

export function TeacherContentPage({ type = 'material' }) {
  if (type === 'announcement') {
    return <AnnouncementCenterPage />;
  }

  const config = pageConfig[type] || pageConfig.material;

  return (
    <FileManagerPage
      eyebrow="Teacher"
      title={config.title}
      description={config.description}
      initialFilters={config.initialFilters}
      lockFileType={config.lockFileType}
    />
  );
}
