import Bull, { Queue, QueueOptions } from 'bull';
import { redisClient } from './redis';

// Queue configuration
const queueOptions: QueueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
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

// Create queues
export const rankCheckQueue: Queue = new Bull('rank-check', queueOptions);

/**
 * Initialize queue event listeners
 */
export function initializeQueues(): void {
  // Rank check queue events
  rankCheckQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, {
      jobId: job.id,
      successCount: result.successCount,
      failedCount: result.failedCount,
    });
  });

  rankCheckQueue.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, {
      jobId: job?.id,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  rankCheckQueue.on('error', (error) => {
    console.error('Queue error:', error);
  });

  rankCheckQueue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled - may need manual intervention`);
  });

  console.log('Job queues initialized');
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
  const queue = queueName === 'rank-check' ? rankCheckQueue : rankCheckQueue;

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
  const queue = queueName === 'rank-check' ? rankCheckQueue : rankCheckQueue;

  await queue.clean(grace, 'completed');
  await queue.clean(grace, 'failed');

  console.log(`Cleaned old jobs from ${queueName} queue`);
}

/**
 * Graceful shutdown
 */
export async function closeQueues(): Promise<void> {
  await rankCheckQueue.close();
  console.log('All queues closed');
}
