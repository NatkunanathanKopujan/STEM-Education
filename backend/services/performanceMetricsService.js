import os from 'os';
import { env } from '../config/env.js';
import { cacheService } from './cacheService.js';

const apiMetrics = [];
const slowRequests = [];
const databaseMetrics = [];
const uploadMetrics = [];
const downloadMetrics = [];
const aiMetrics = [];
const MAX_EVENTS = 500;

function pushLimited(collection, item) {
  collection.push({ ...item, timestamp: new Date().toISOString() });
  if (collection.length > MAX_EVENTS) collection.shift();
}

function average(items, selector) {
  if (!items.length) return 0;
  return Number((items.reduce((total, item) => total + Number(selector(item) || 0), 0) / items.length).toFixed(2));
}

export const performanceMetricsService = {
  recordApiRequest(metric) {
    pushLimited(apiMetrics, metric);
  },

  recordSlowRequest(metric) {
    pushLimited(slowRequests, metric);
  },

  recordDatabaseQuery(metric) {
    pushLimited(databaseMetrics, metric);
  },

  recordUpload(metric) {
    pushLimited(uploadMetrics, metric);
  },

  recordDownload(metric) {
    pushLimited(downloadMetrics, metric);
  },

  recordAiProcessing(metric) {
    pushLimited(aiMetrics, metric);
  },

  getDashboard() {
    const memory = process.memoryUsage();
    const recentRequests = apiMetrics.slice(-100);
    const cacheStats = cacheService.stats();

    return {
      api: {
        totalRequests: apiMetrics.length,
        averageResponseTimeMs: average(recentRequests, (item) => item.durationMs),
        slowRequests: slowRequests.slice(-20).reverse(),
        statusBreakdown: recentRequests.reduce((accumulator, item) => {
          const key = String(item.statusCode || 0);
          accumulator[key] = (accumulator[key] || 0) + 1;
          return accumulator;
        }, {}),
      },
      database: {
        averageQueryTimeMs: average(databaseMetrics.slice(-100), (item) => item.durationMs),
        slowQueries: databaseMetrics
          .filter((item) => item.isSlow)
          .slice(-20)
          .reverse(),
      },
      cache: cacheStats,
      runtime: {
        cpuLoad: os.loadavg()[0],
        memoryUsageMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        uptimeSeconds: Math.round(process.uptime()),
      },
      ai: {
        averageProcessingTimeMs: average(aiMetrics.slice(-100), (item) => item.durationMs),
        totalOperations: aiMetrics.length,
      },
      files: {
        averageUploadSpeedMbps: average(uploadMetrics.slice(-100), (item) => item.speedMbps),
        averageDownloadSpeedMbps: average(downloadMetrics.slice(-100), (item) => item.speedMbps),
      },
      monitoring: {
        prometheusReady: Boolean(process.env.PROMETHEUS_ENDPOINT),
        grafanaReady: Boolean(process.env.GRAFANA_URL),
        openTelemetryReady: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
        cacheProvider: env.performance.cacheProvider,
      },
    };
  },
};
