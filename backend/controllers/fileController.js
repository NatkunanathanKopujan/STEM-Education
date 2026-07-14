import { sendSuccess } from '../utils/apiResponse.js';
import {
  getDownloadStream,
  getFile,
  getFiles,
  getFileStatistics,
  getPreviewStream,
  getVersionHistory,
  removeFile,
  restoreFileVersion,
  updateFile,
  uploadManagedFile,
  uploadMultipleManagedFiles,
} from '../services/fileService.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  deviceInfo: {
    userAgent: req.get('user-agent'),
  },
});

export const fileController = {
  async upload(req, res) {
    const data = await uploadManagedFile(req.user, req.file, req.body);
    return sendSuccess(res, data, data.message || 'File uploaded', data.duplicate ? 409 : 201);
  },

  async uploadMultiple(req, res) {
    return sendSuccess(
      res,
      await uploadMultipleManagedFiles(req.user, req.files, req.body),
      'Files uploaded',
      201,
    );
  },

  async index(req, res) {
    return sendSuccess(res, await getFiles(req.user, req.query), 'Files fetched');
  },

  async show(req, res) {
    return sendSuccess(res, await getFile(req.user, req.params.id), 'File fetched');
  },

  async update(req, res) {
    return sendSuccess(res, await updateFile(req.user, req.params.id, req.body), 'File updated');
  },

  async remove(req, res) {
    return sendSuccess(res, await removeFile(req.user, req.params.id), 'File deleted');
  },

  async download(req, res) {
    const { file, stream } = await getDownloadStream(req.user, req.params.id, requestMeta(req));
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFileName)}"`);
    return stream.pipe(res);
  },

  async preview(req, res) {
    const { file, stream } = await getPreviewStream(req.user, req.params.id, requestMeta(req));
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalFileName)}"`);
    return stream.pipe(res);
  },

  async history(req, res) {
    return sendSuccess(res, await getVersionHistory(req.user, req.params.id), 'File version history fetched');
  },

  async restoreVersion(req, res) {
    return sendSuccess(res, await restoreFileVersion(req.user, req.params.id), 'File version restored');
  },

  async statistics(req, res) {
    return sendSuccess(res, await getFileStatistics(req.user), 'Storage statistics fetched');
  },
};
