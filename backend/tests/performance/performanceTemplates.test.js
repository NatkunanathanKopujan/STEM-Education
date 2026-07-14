import { describe, expect, test } from '@jest/globals';

describe('performance test templates', () => {
  test('concurrent login scenario shape', () => {
    const scenario = {
      name: 'concurrent-logins',
      virtualUsers: 1000,
      rampUpSeconds: 120,
      targetP95Ms: 500,
    };

    expect(scenario.virtualUsers).toBeGreaterThan(100);
    expect(scenario.targetP95Ms).toBeLessThanOrEqual(500);
  });

  test('large upload scenario shape', () => {
    const scenario = {
      name: 'large-file-upload',
      maxFileSizeMb: 200,
      concurrentUploads: 50,
      targetErrorRate: 0.01,
    };

    expect(scenario.concurrentUploads).toBeGreaterThan(1);
    expect(scenario.targetErrorRate).toBeLessThan(0.05);
  });
});
