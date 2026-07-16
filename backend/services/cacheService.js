import { env } from '../config/env.js';

class MemoryCacheProvider {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.stats.misses += 1;
      return null;
    }

    this.stats.hits += 1;
    return entry.value;
  }

  set(key, value, ttlSeconds = env.performance.cacheDefaultTtlSeconds) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    this.stats.sets += 1;
    return value;
  }

  delete(key) {
    this.stats.deletes += 1;
    return this.store.delete(key);
  }

  clear(prefix = '') {
    for (const key of this.store.keys()) {
      if (!prefix || key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      entries: this.store.size,
      hitRate: total ? Number(((this.stats.hits / total) * 100).toFixed(2)) : 0,
      provider: 'memory',
    };
  }
}

class FutureCacheProvider extends MemoryCacheProvider {
  getStats() {
    return {
      ...super.getStats(),
      configuredProvider: env.performance.cacheProvider,
      provider: 'memory',
      fallbackActive: true,
    };
  }
}

const provider =
  env.performance.cacheProvider === 'memory' ? new MemoryCacheProvider() : new FutureCacheProvider();

export const cacheService = {
  get: (key) => provider.get(key),
  set: (key, value, ttlSeconds) => provider.set(key, value, ttlSeconds),
  delete: (key) => provider.delete(key),
  clear: (prefix) => provider.clear(prefix),
  stats: () => provider.getStats(),
  async getOrSet(key, factory, ttlSeconds) {
    const cached = provider.get(key);
    if (cached !== null) return cached;

    const value = await factory();
    provider.set(key, value, ttlSeconds);
    return value;
  },
};

export function cacheKey(namespace, payload = {}) {
  return `${namespace}:${JSON.stringify(payload)}`;
}
