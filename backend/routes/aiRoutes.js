import { Router } from 'express';
import {
  buildKnowledgeBaseController,
  extractTextController,
  getKnowledgeController,
  getTopicsController,
  markTopicController,
  processMaterialController,
} from '../controllers/aiController.js';
import {
  aiCostsController,
  aiLogsController,
  generateBatchController,
  generateController,
  modelsController,
  providersController,
  regenerateController,
  validateAiQuestionController,
} from '../controllers/aiIntegrationController.js';
import {
  deleteQuestionController,
  generateQuestionsController,
  getGenerationLogsController,
  getQuestionController,
  getQuestionsController,
  regenerateQuestionController,
  restoreQuestionController,
  updateQuestionController,
} from '../controllers/aiQuestionController.js';
import { ROLES } from '../config/roles.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { uploadFor } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  aiKnowledgeValidator,
  aiListValidator,
  aiMaterialValidator,
  aiTopicValidator,
} from '../validators/aiValidators.js';
import {
  generateQuestionsValidator,
  questionIdValidator,
  questionSearchValidator,
  updateQuestionValidator,
} from '../validators/aiQuestionValidators.js';
import {
  aiGenerateBatchValidator,
  aiGenerateValidator,
  aiLogsValidator,
  aiRegenerateValidator,
  aiValidateValidator,
} from '../validators/aiIntegrationValidators.js';

const router = Router();
const aiRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER];

router.use(authenticate);
router.use(authorize(...aiRoles));

router.post('/extract-text', uploadFor('aiMaterials'), extractTextController);
router.post(
  '/process-material',
  uploadFor('aiMaterials'),
  aiMaterialValidator,
  validateRequest,
  processMaterialController,
);
router.post(
  '/build-knowledge-base',
  uploadFor('aiMaterials'),
  aiKnowledgeValidator,
  validateRequest,
  buildKnowledgeBaseController,
);
router.post('/topics', aiTopicValidator, validateRequest, markTopicController);
router.get('/knowledge', aiListValidator, validateRequest, getKnowledgeController);
router.post('/generate', aiGenerateValidator, validateRequest, generateController);
router.post('/generate-batch', aiGenerateBatchValidator, validateRequest, generateBatchController);
router.post('/regenerate', aiRegenerateValidator, validateRequest, regenerateController);
router.post('/validate', aiValidateValidator, validateRequest, validateAiQuestionController);
router.get('/providers', providersController);
router.get('/models', modelsController);
router.get('/logs', aiLogsValidator, validateRequest, aiLogsController);
router.get('/costs', aiCostsController);
router.post(
  '/generate-questions',
  generateQuestionsValidator,
  validateRequest,
  generateQuestionsController,
);
router.post(
  '/regenerate-question/:id',
  questionIdValidator,
  validateRequest,
  regenerateQuestionController,
);
router.get('/questions', questionSearchValidator, validateRequest, getQuestionsController);
router.get('/questions/:id', questionIdValidator, validateRequest, getQuestionController);
router.put('/questions/:id', updateQuestionValidator, validateRequest, updateQuestionController);
router.delete('/questions/:id', questionIdValidator, validateRequest, deleteQuestionController);
router.post('/questions/:id/restore', questionIdValidator, validateRequest, restoreQuestionController);
router.get('/generation-logs', aiListValidator, validateRequest, getGenerationLogsController);
router.get('/topics', getTopicsController);

export default router;
