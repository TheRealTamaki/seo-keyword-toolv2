import { Job } from 'bull';
import { getDecryptedApiKey } from '../models/api-key.model';
import { performBulkRankChecks, storeRankCheckResults } from '../services/rank-check.service';

export interface RankCheckJobData {
  userId: string;
  keywordIds: string[];
  searchEngines?: string[];
  devices?: string[];
  locations?: string[];
  projectId?: string; // Optional: for logging/tracking
}

export interface RankCheckJobResult {
  jobId: string | number | undefined;
  successCount: number;
  failedCount: number;
  rankingsStored: number;
  errors: Array<{ keywordId: string; error: string }>;
  completedAt: Date;
}

/**
 * Process a rank check job
 */
export async function processRankCheckJob(
  job: Job<RankCheckJobData>
): Promise<RankCheckJobResult> {
  const { userId, keywordIds, searchEngines, devices, locations, projectId } = job.data;

  console.log(`Processing rank check job ${job.id}:`, {
    userId,
    keywordCount: keywordIds.length,
    projectId,
  });

  try {
    // Get user's DataForSEO API key
    const apiKey = await getDecryptedApiKey(userId);

    if (!apiKey) {
      throw new Error('No DataForSEO API key found for user');
    }

    // Update job progress
    await job.progress(10);

    // Perform bulk rank checks
    const bulkResult = await performBulkRankChecks(
      apiKey,
      userId,
      keywordIds,
      searchEngines || ['google'],
      devices || ['desktop'],
      locations || ['United States']
    );

    // Update job progress
    await job.progress(80);

    // Store results in database
    const storedCount = await storeRankCheckResults(bulkResult.results);

    // Update job progress
    await job.progress(100);

    const result: RankCheckJobResult = {
      jobId: job.id,
      successCount: bulkResult.success,
      failedCount: bulkResult.failed,
      rankingsStored: storedCount,
      errors: bulkResult.errors,
      completedAt: new Date(),
    };

    console.log(`Rank check job ${job.id} completed:`, {
      successCount: result.successCount,
      failedCount: result.failedCount,
      rankingsStored: result.rankingsStored,
    });

    return result;
  } catch (error: any) {
    console.error(`Error in rank check job ${job.id}:`, error);
    throw new Error(`Rank check job failed: ${error.message}`);
  }
}
