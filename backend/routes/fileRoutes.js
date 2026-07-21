import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { fileController } from '../controllers/fileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { uploadFor } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  fileIdValidator,
  fileListValidator,
  fileUpdateValidator,
  uploadMetadataValidator,
} from '../validators/fileValidators.js';

const router = Router();
const fileRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT];

router.use(authenticate);
router.use(authorize(...fileRoles));

router.post('/upload', uploadFor('files'), uploadMetadataValidator, validateRequest, fileController.upload);
router.post(
  '/upload-multiple',
  uploadFor('files', 'files', { multiple: true, maxCount: 20 }),
  uploadMetadataValidator,
  validateRequest,
  fileController.uploadMultiple,
);
router.get('/storage/statistics', fileController.statistics);
router.get('/', fileListValidator, validateRequest, fileController.index);
router.get('/download/:id', fileIdValidator, validateRequest, fileController.download);
router.get('/preview/:id', fileIdValidator, validateRequest, fileController.preview);
router.get('/history/:id', fileIdValidator, validateRequest, fileController.history);
router.post('/restore-version/:id', fileIdValidator, validateRequest, fileController.restoreVersion);
router.get('/:id', fileIdValidator, validateRequest, fileController.show);
router.put('/:id', fileUpdateValidator, validateRequest, fileController.update);
router.delete('/:id', fileIdValidator, validateRequest, fileController.remove);

export default router;
