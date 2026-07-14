import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { generateId } from '../utils/idGenerator.js';
import { allowedFileGroups, allManagedFileExtensions, isAllowedExtension } from '../utils/fileHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const uploadFolders = {
  pdf: 'pdf',
  ppt: 'ppt',
  documents: 'notes',
  videos: 'videos',
  images: 'profiles',
  assignments: 'assignments',
  announcements: 'announcements',
  profiles: 'profiles',
  aiMaterials: 'notes',
  files: 'files',
};

const extensionGroups = {
  pdf: allowedFileGroups.pdf,
  ppt: allowedFileGroups.ppt,
  documents: allowedFileGroups.documents,
  videos: allowedFileGroups.videos,
  images: allowedFileGroups.images,
  assignments: [
    ...allowedFileGroups.pdf,
    ...allowedFileGroups.documents,
    ...allowedFileGroups.spreadsheets,
    ...allowedFileGroups.archives,
    ...allowedFileGroups.images,
    ...allowedFileGroups.videos,
  ],
  announcements: [
    ...allowedFileGroups.pdf,
    ...allowedFileGroups.documents,
    ...allowedFileGroups.images,
  ],
  profiles: allowedFileGroups.images,
  aiMaterials: [
    ...allowedFileGroups.pdf,
    ...allowedFileGroups.ppt,
    ...allowedFileGroups.documents,
    '.txt',
    '.md',
  ],
  files: allManagedFileExtensions,
};

function ensureDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const uploadType = req.uploadType || 'documents';
    const folder = uploadFolders[uploadType] || uploadFolders.documents;
    const directory = path.join(backendRoot, 'uploads', folder);
    ensureDirectory(directory);
    callback(null, directory);
  },
  filename: (req, file, callback) => {
    const uploadType = req.uploadType || 'documents';
    callback(null, `${uploadType}-${generateId()}${path.extname(file.originalname)}`);
  },
});

const multerInstance = multer({
  storage,
  fileFilter: (req, file, callback) => {
    const uploadType = req.uploadType || 'documents';
    const allowedExtensions = extensionGroups[uploadType] || extensionGroups.documents;

    if (!isAllowedExtension(file.originalname, allowedExtensions)) {
      return callback(new Error(`Invalid file type for ${uploadType} upload`));
    }

    return callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * env.storage.maxFileSizeMb,
  },
});

export function uploadFor(uploadType, fieldName = 'file', options = {}) {
  return (req, res, next) => {
    req.uploadType = uploadType;
    const handler = options.multiple
      ? multerInstance.array(fieldName, options.maxCount || 10)
      : multerInstance.single(fieldName);

    return handler(req, res, next);
  };
}

export const upload = multerInstance;
