import { createRequire } from 'module';
import { env } from '../config/env.js';
import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { getStorageStatistics } from '../repositories/fileRepository.js';
import { jobQueueService } from './jobQueueService.js';
import { performanceMetricsService } from './performanceMetricsService.js';

const require = createRequire(import.meta.url);
const backendPackage = require('../package.json');

function ensureSuperAdmin(user) {
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Only Super Admin can view performance metrics', 403);
  }
}

export async function getPerformanceDashboard(user) {
  ensureSuperAdmin(user);
  const [metrics, storage] = await Promise.all([
    Promise.resolve(performanceMetricsService.getDashboard()),
    getStorageStatistics(user).catch(() => null),
  ]);
  const queues = jobQueueService.listQueues();
  const cacheProvider = metrics.cache?.provider || env.performance.cacheProvider;
  const backendDependencies = {
    ...backendPackage.dependencies,
    ...backendPackage.devDependencies,
  };
  const middlewareFeatures = {
    routeCodeSplitting: process.env.FRONTEND_ROUTE_CODE_SPLITTING !== 'false',
    compressionEnabled: Boolean(backendDependencies.compression),
    etagEnabled: process.env.API_ETAG_ENABLED !== 'false',
  };

  return {
    ...metrics,
    storage,
    queues,
    optimization: {
      routeCodeSplitting: middlewareFeatures.routeCodeSplitting,
      compressionEnabled: middlewareFeatures.compressionEnabled,
      etagEnabled: middlewareFeatures.etagEnabled,
      cacheProviderReady: Boolean(cacheProvider),
      redisReady: cacheProvider === 'redis',
      elasticsearchReady: Boolean(process.env.ELASTICSEARCH_URL),
      backgroundJobsReady: queues.every((queue) => queue.ready),
      loadTestingReady: Boolean(process.env.LOAD_TESTING_ENABLED === 'true'),
    },
  };
}
