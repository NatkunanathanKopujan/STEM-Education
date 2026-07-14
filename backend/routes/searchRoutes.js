import { Router } from 'express';
import {
  analyticsController,
  clearHistoryController,
  deleteSavedSearchController,
  historyController,
  savedSearchesController,
  saveSearchController,
  searchController,
  suggestionsController,
  updateSavedSearchController,
} from '../controllers/searchController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { apiCache } from '../middleware/performanceMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  savedSearchIdValidator,
  saveSearchValidator,
  searchQueryValidator,
  updateSavedSearchValidator,
} from '../validators/searchValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', searchQueryValidator, validateRequest, searchController);
router.get('/suggestions', searchQueryValidator, validateRequest, apiCache({ namespace: 'search:suggestions', ttlSeconds: 20 }), suggestionsController);
router.get('/history', historyController);
router.delete('/history', clearHistoryController);
router.post('/save', saveSearchValidator, validateRequest, saveSearchController);
router.get('/saved', savedSearchesController);
router.put('/saved/:id', updateSavedSearchValidator, validateRequest, updateSavedSearchController);
router.delete('/saved/:id', savedSearchIdValidator, validateRequest, deleteSavedSearchController);
router.get('/analytics', apiCache({ namespace: 'search:analytics', ttlSeconds: 30 }), analyticsController);

export default router;
