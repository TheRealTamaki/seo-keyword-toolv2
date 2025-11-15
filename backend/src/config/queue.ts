import Bull, { Queue, QueueOptions } from 'bull';

// Queue configuration
const queueOptions: QueueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    // Disable retries at module load to prevent error spam
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't retry connection at module load
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay, doubles each retry
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
};

// Lazy-load queues to prevent errors when Redis is not available
let rankCheckQueueInstance: Queue | null = null;

export const getRankCheckQueue = (): Queue => {
  if (!rankCheckQueueInstance) {
    rankCheckQueueInstance = new Bull('rank-check', queueOptions);
  }
  return rankCheckQueueInstance;
};

// For backwards compatibility
export const rankCheckQueue: Queue = getRankCheckQueue();

/**
 * Initialize queue event listeners
 */
export function initializeQueues(): void {
  const queue = getRankCheckQueue();

  // Rank check queue events
  queue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, {
      jobId: job.id,
      successCount: result.successCount,
      failedCount: result.failedCount,
    });
  });

  queue.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, {
      jobId: job?.id,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  queue.on('error', (error) => {
    // Only log error once, not repeatedly
    if (!error.message?.includes('ECONNREFUSED')) {
      console.error('Queue error:', error);
    }
  });

  queue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled - may need manual intervention`);
  });

  console.log('✓ Job queues initialized');
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: string = 'rank-check'): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}> {
  const queue = getRankCheckQueue();

  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getPausedCount(),
  ]);

  return { waiting, active, completed, failed, delayed, paused };
}

/**
 * Clean up old jobs
 */
export async function cleanOldJobs(
  queueName: string = 'rank-check',
  grace: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<void> {
  const queue = getRankCheckQueue();

  await queue.clean(grace, 'completed');
  await queue.clean(grace, 'failed');

  console.log(`Cleaned old jobs from ${queueName} queue`);
}

/**
 * Graceful shutdown
 */
export async function closeQueues(): Promise<void> {
  if (rankCheckQueueInstance) {
    await rankCheckQueueInstance.close();
    console.log('✓ All queues closed');
  }
}
