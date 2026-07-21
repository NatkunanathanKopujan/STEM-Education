import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

function resolveManagedPath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  const absolutePath = path.resolve(backendRoot, normalized);
  const uploadsRoot = path.resolve(backendRoot, 'uploads');

  if (!absolutePath.startsWith(uploadsRoot)) {
    throw new Error('Invalid file path');
  }

  return absolutePath;
}

class LocalStorageProvider {
  get name() {
    return 'local';
  }

  async exists(relativePath) {
    return fs.existsSync(resolveManagedPath(relativePath));
  }

  createReadStream(relativePath) {
    return fs.createReadStream(resolveManagedPath(relativePath));
  }

  async delete(relativePath) {
    const absolutePath = resolveManagedPath(relativePath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }

  buildPreviewUrl(fileId) {
    return `/api/files/preview/${fileId}`;
  }

  buildDownloadUrl(fileId) {
    return `/api/files/download/${fileId}`;
  }
}

class ExternalStorageProvider {
  constructor(name) {
    this.providerName = name;
  }

  get name() {
    return this.providerName;
  }

  unsupported() {
    throw new Error(`${this.providerName} storage provider requires a configured storage integration`);
  }

  exists() {
    return this.unsupported();
  }

  createReadStream() {
    return this.unsupported();
  }

  delete() {
    return this.unsupported();
  }

  buildPreviewUrl(fileId) {
    return `${env.storage.localBaseUrl}/api/files/preview/${fileId}`;
  }

  buildDownloadUrl(fileId) {
    return `${env.storage.localBaseUrl}/api/files/download/${fileId}`;
  }
}

export function getStorageProvider() {
  if (env.storage.provider === 'local') {
    return new LocalStorageProvider();
  }

  return new ExternalStorageProvider(env.storage.provider);
}
