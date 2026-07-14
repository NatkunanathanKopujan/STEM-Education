const queues = new Map([
  ['email', { name: 'email', status: 'prepared', description: 'Email delivery queue placeholder' }],
  ['notification', { name: 'notification', status: 'prepared', description: 'Notification fan-out queue placeholder' }],
  ['ai', { name: 'ai', status: 'prepared', description: 'AI processing queue placeholder' }],
  ['report', { name: 'report', status: 'prepared', description: 'Report generation queue placeholder' }],
  ['backup', { name: 'backup', status: 'prepared', description: 'Backup queue placeholder' }],
  ['video', { name: 'video', status: 'prepared', description: 'Video processing queue placeholder' }],
]);

export const jobQueueService = {
  listQueues() {
    return Array.from(queues.values());
  },

  registerQueue(name, config) {
    queues.set(name, { name, status: 'prepared', ...config });
    return queues.get(name);
  },

  enqueue(queueName, job) {
    const queue = queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} is not registered`);
    }

    return {
      queue: queueName,
      status: 'accepted-for-future-worker',
      job,
      createdAt: new Date().toISOString(),
    };
  },
};
