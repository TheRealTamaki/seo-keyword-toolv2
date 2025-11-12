import { Job, JobOptions } from 'bull';
import { rankCheckQueue } from '../config/queue';
import { RankCheckJobData, RankCheckJobResult } from '../jobs/rank-check.processor';
import { getProjectKeywords } from '../models/keyword.model';

export interface ScheduleConfig {
  projectId: string;
  userId: string;
  searchEngines: string[];
  devices: string[];
  locations: string[];
  schedule: string; // Cron expression or interval
}

/**
 * Schedule a recurring rank check for a project
 * @param config - Schedule configuration
 * @returns Job instance
 */
export async function scheduleRankCheck(config: ScheduleConfig): Promise<Job<RankCheckJobData>> {
  const { projectId, userId, searchEngines, devices, locations, schedule } = config;

  // Get all keywords for the project
  const keywordResult = await getProjectKeywords(projectId, {}, 1, 1000);
  const keywordIds = keywordResult.keywords.map((k) => k.id);

  if (keywordIds.length === 0) {
    throw new Error('No keywords found for this project');
  }

  const jobData: RankCheckJobData = {
    userId,
    keywordIds,
    searchEngines,
    devices,
    locations,
    projectId,
  };

  const jobOptions: JobOptions = {
    repeat: {
      cron: schedule, // e.g., '0 0 * * *' for daily at midnight
    },
    jobId: `rank-check-${projectId}`, // Unique job ID for this project
  };

  const job = await rankCheckQueue.add(jobData, jobOptions);

  console.log(`Scheduled rank check for project ${projectId}:`, {
    jobId: job.id,
    schedule,
    keywordCount: keywordIds.length,
  });

  return job;
}

/**
 * Queue an immediate one-time rank check
 * @param userId - User ID
 * @param keywordIds - Array of keyword IDs
 * @param options - Search options
 * @returns Job instance
 */
export async function queueRankCheck(
  userId: string,
  keywordIds: string[],
  options: {
    searchEngines?: string[];
    devices?: string[];
    locations?: string[];
    projectId?: string;
  } = {}
): Promise<Job<RankCheckJobData>> {
  const jobData: RankCheckJobData = {
    userId,
    keywordIds,
    searchEngines: options.searchEngines || ['google'],
    devices: options.devices || ['desktop'],
    locations: options.locations || ['United States'],
    projectId: options.projectId,
  };

  const job = await rankCheckQueue.add(jobData, {
    priority: 1, // Higher priority for manual checks
  });

  console.log(`Queued immediate rank check:`, {
    jobId: job.id,
    userId,
    keywordCount: keywordIds.length,
  });

  return job;
}

/**
 * Cancel a scheduled rank check
 * @param projectId - Project ID
 * @returns Boolean indicating success
 */
export async function cancelScheduledRankCheck(projectId: string): Promise<boolean> {
  const jobId = `rank-check-${projectId}`;

  try {
    const job = await rankCheckQueue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();
    console.log(`Cancelled scheduled rank check for project ${projectId}`);
    return true;
  } catch (error) {
    console.error(`Error cancelling scheduled rank check:`, error);
    return false;
  }
}

/**
 * Get scheduled rank check for a project
 * @param projectId - Project ID
 * @returns Job instance or null
 */
export async function getScheduledRankCheck(
  projectId: string
): Promise<Job<RankCheckJobData> | null> {
  const jobId = `rank-check-${projectId}`;

  try {
    const job = await rankCheckQueue.getJob(jobId);
    return job || null;
  } catch (error) {
    console.error(`Error getting scheduled rank check:`, error);
    return null;
  }
}

/**
 * Update schedule for an existing rank check
 * @param projectId - Project ID
 * @param newSchedule - New cron expression
 * @returns Updated job instance
 */
export async function updateRankCheckSchedule(
  projectId: string,
  newSchedule: string
): Promise<Job<RankCheckJobData> | null> {
  // Cancel existing schedule
  await cancelScheduledRankCheck(projectId);

  // Get the old job data to recreate with new schedule
  const oldJob = await getScheduledRankCheck(projectId);

  if (!oldJob) {
    return null;
  }

  // Create new schedule
  const config: ScheduleConfig = {
    projectId,
    userId: oldJob.data.userId,
    searchEngines: oldJob.data.searchEngines || ['google'],
    devices: oldJob.data.devices || ['desktop'],
    locations: oldJob.data.locations || ['United States'],
    schedule: newSchedule,
  };

  return await scheduleRankCheck(config);
}

/**
 * Get job status and result
 * @param jobId - Job ID
 * @returns Job status info
 */
export async function getJobStatus(
  jobId: string | number
): Promise<{
  id: string | number | undefined;
  state: string;
  progress: number | object;
  result?: RankCheckJobResult;
  failedReason?: string;
  attemptsMade: number;
  data: RankCheckJobData;
} | null> {
  try {
    const job = await rankCheckQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      state,
      progress,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      data: job.data,
    };
  } catch (error) {
    console.error(`Error getting job status:`, error);
    return null;
  }
}

/**
 * List all scheduled jobs
 * @returns Array of scheduled jobs
 */
export async function listScheduledJobs(): Promise<Array<{
  id: string | number | undefined;
  projectId: string | undefined;
  schedule: string | undefined;
  nextRun: Date | null;
}>> {
  try {
    const repeatableJobs = await rankCheckQueue.getRepeatableJobs();

    return repeatableJobs.map((job) => ({
      id: job.id,
      projectId: job.id?.toString().replace('rank-check-', ''),
      schedule: job.cron,
      nextRun: job.next ? new Date(job.next) : null,
    }));
  } catch (error) {
    console.error(`Error listing scheduled jobs:`, error);
    return [];
  }
}
