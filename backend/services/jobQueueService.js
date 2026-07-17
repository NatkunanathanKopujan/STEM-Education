const defaultQueues = [
  ['email', 'Email delivery'],
  ['notification', 'Notification fan-out'],
  ['ai', 'AI processing'],
  ['report', 'Report generation'],
  ['backup', 'Backup processing'],
  ['video', 'Video processing'],
];

const queues = new Map(
  defaultQueues.map(([name, description]) => [
    name,
    {
      name,
      description,
      status: 'not_configured',
      pending: 0,
      completed: 0,
      failed: 0,
      lastJobAt: null,
    },
  ]),
);

function serializeQueue(queue) {
  return {
    ...queue,
    ready: queue.status === 'ready',
  };
}

export const jobQueueService = {
  listQueues() {
    return Array.from(queues.values()).map(serializeQueue);
  },

  registerQueue(name, config) {
    queues.set(name, {
      name,
      description: config.description || name,
      status: config.status || 'ready',
      pending: config.pending || 0,
      completed: config.completed || 0,
      failed: config.failed || 0,
      lastJobAt: config.lastJobAt || null,
    });
    return serializeQueue(queues.get(name));
  },

  enqueue(queueName, job) {
    const queue = queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} is not registered`);
    }

    queue.pending += 1;
    queue.lastJobAt = new Date().toISOString();
    queue.pending -= 1;
    queue.completed += 1;

    return {
      queue: queueName,
      status: 'completed',
      job,
      createdAt: queue.lastJobAt,
    };
  },
};
