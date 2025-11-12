import { rankCheckQueue } from '../config/queue';
import { processRankCheckJob } from './rank-check.processor';

/**
 * Initialize job processors
 */
export function initializeWorkers(): void {
  // Register rank check processor
  rankCheckQueue.process(async (job) => {
    return await processRankCheckJob(job);
  });

  console.log('Job workers initialized');
}
