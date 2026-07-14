import path from 'path';

export const allowedFileGroups = {
  pdf: ['.pdf'],
  ppt: ['.ppt', '.pptx'],
  documents: ['.doc', '.docx', '.txt', '.md'],
  spreadsheets: ['.xls', '.xlsx'],
  archives: ['.zip'],
  videos: ['.mp4', '.mov', '.avi'],
  images: ['.jpg', '.jpeg', '.png', '.webp'],
  audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
};

export const allManagedFileExtensions = Object.values(allowedFileGroups).flat();

export function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

export function isAllowedExtension(filename, allowedExtensions) {
  return allowedExtensions.includes(getFileExtension(filename));
}

export function normalizeUploadPath(file) {
  if (!file) {
    return null;
  }

  return file.path.replace(/\\/g, '/');
}

export function getFileCategory(filename) {
  const extension = getFileExtension(filename);
  const [category] =
    Object.entries(allowedFileGroups).find(([, extensions]) => extensions.includes(extension)) || [];

  return category || 'other';
}
