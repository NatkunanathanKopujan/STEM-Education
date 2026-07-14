import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { getStorageStatistics } from '../repositories/fileRepository.js';
import { jobQueueService } from './jobQueueService.js';
import { performanceMetricsService } from './performanceMetricsService.js';

function ensureSuperAdmin(user) {
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Only Super Admin can view performance metrics', 403);
  }
}

export async function getPerformanceDashboard(user) {
  ensureSuperAdmin(user);
  const [metrics, storage] = await Promise.all([
    Promise.resolve(performanceMetricsService.getDashboard()),
    getStorageStatistics().catch(() => null),
  ]);

  return {
    ...metrics,
    storage,
    queues: jobQueueService.listQueues(),
    optimization: {
      routeCodeSplitting: true,
      compressionEnabled: true,
      etagEnabled: true,
      cacheProviderReady: true,
      redisReady: true,
      elasticsearchReady: true,
      backgroundJobsReady: true,
      loadTestingReady: true,
    },
  };
}
