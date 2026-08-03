const extensionMap = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  rtf: 'word',
  odt: 'word',
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  ods: 'spreadsheet',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp4: 'video',
  webm: 'video',
  avi: 'video',
  mov: 'video',
  m4v: 'video',
  mkv: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  txt: 'text',
  md: 'text',
};

const backendTypeMap = {
  pdf: 'pdf',
  ppt: 'presentation',
  presentations: 'presentation',
  documents: 'word',
  spreadsheets: 'spreadsheet',
  archives: 'archive',
  images: 'image',
  videos: 'video',
  audio: 'audio',
};

const labels = {
  video: 'Video',
  pdf: 'PDF',
  word: 'Word',
  presentation: 'Presentation',
  spreadsheet: 'Spreadsheet',
  image: 'Image',
  audio: 'Audio',
  archive: 'Archive',
  text: 'Text Note',
  unknown: 'Document',
};

const badges = {
  video: 'VIDEO',
  pdf: 'PDF',
  word: 'DOC',
  presentation: 'PPT',
  spreadsheet: 'XLS',
  image: 'IMG',
  audio: 'AUDIO',
  archive: 'ZIP',
  text: 'TXT',
  unknown: 'FILE',
};

export function getFileExtension(file = {}) {
  const name = String(file.originalFileName || file.fileName || file.title || file.name || '');
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
}

export function getFileCategory(file = {}) {
  const mime = String(file.mimeType || file.contentType || file.type || '').toLowerCase();
  const backendType = String(file.fileType || '').toLowerCase();
  const extension = getFileExtension(file);

  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('wordprocessingml') || mime === 'application/msword') return 'word';
  if (mime.includes('presentationml') || mime === 'application/vnd.ms-powerpoint') return 'presentation';
  if (mime.includes('spreadsheetml') || mime === 'application/vnd.ms-excel' || mime === 'text/csv') return 'spreadsheet';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('zip') || mime.includes('x-7z') || mime.includes('rar') || mime.includes('x-tar')) return 'archive';
  if (mime.startsWith('text/')) return 'text';

  return extensionMap[extension] || backendTypeMap[backendType] || 'unknown';
}

export function getFileIdentity(file = {}) {
  const category = getFileCategory(file);
  return {
    category,
    label: labels[category] || labels.unknown,
    badge: badges[category] || badges.unknown,
    extension: getFileExtension(file),
    isVideo: category === 'video',
    isImage: category === 'image',
    isPreviewableDocument: ['pdf', 'image', 'video', 'audio', 'text'].includes(category),
  };
}

export function isVideoFile(file = {}) {
  return getFileCategory(file) === 'video';
}
