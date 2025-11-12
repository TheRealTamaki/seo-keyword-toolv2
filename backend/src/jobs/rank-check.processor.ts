import { Job } from 'bull';
import { getDecryptedApiKey } from '../models/api-key.model';
import { performBulkRankChecks, storeRankCheckResults } from '../services/rank-check.service';
import { processRankingChanges, RankingChange } from '../services/alert.service';
import { pool } from '../config/database';

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

    // Process alerts for ranking changes
    await job.progress(90);
    try {
      const rankingChanges = await extractRankingChanges(keywordIds);
      if (rankingChanges.length > 0) {
        await processRankingChanges(rankingChanges);
        console.log(`Processed ${rankingChanges.length} ranking changes for alerts`);
      }
    } catch (alertError) {
      console.error('Error processing alerts:', alertError);
      // Don't fail the job if alert processing fails
    }

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

/**
 * Extract ranking changes by comparing latest two rankings for each keyword
 */
async function extractRankingChanges(keywordIds: string[]): Promise<RankingChange[]> {
  if (keywordIds.length === 0) {
    return [];
  }

  // Get latest two rankings for each keyword
  const query = `
    WITH ranked_rankings AS (
      SELECT
        r.*,
        k.keyword,
        k.search_volume,
        p.domain,
        ROW_NUMBER() OVER (PARTITION BY r.keyword_id ORDER BY r.checked_at DESC) as rn
      FROM rankings r
      INNER JOIN keywords k ON r.keyword_id = k.id
      LEFT JOIN projects p ON k.project_id = p.id
      WHERE r.keyword_id = ANY($1)
    )
    SELECT
      current.keyword_id,
      current.keyword,
      current.domain,
      current.id as ranking_id,
      current.search_engine,
      current.device_type,
      current.location_code,
      current.search_volume,
      current.serp_features,
      current.position as new_position,
      previous.position as old_position
    FROM ranked_rankings current
    LEFT JOIN ranked_rankings previous
      ON current.keyword_id = previous.keyword_id
      AND previous.rn = 2
    WHERE current.rn = 1
  `;

  const result = await pool.query(query, [keywordIds]);

  const changes: RankingChange[] = result.rows.map((row: any) => ({
    keywordId: row.keyword_id,
    rankingId: row.ranking_id,
    keyword: row.keyword,
    domain: row.domain || '',
    searchEngine: row.search_engine || 'google',
    deviceType: row.device_type || 'desktop',
    locationCode: row.location_code || 2840,
    oldPosition: row.old_position,
    newPosition: row.new_position,
    positionChange:
      row.new_position !== null && row.old_position !== null
        ? row.new_position - row.old_position
        : 0,
    searchVolume: row.search_volume || 0,
    serpFeatures: row.serp_features || [],
  }));

  return changes;
}
