import pool from '../config/database';

export interface Ranking {
  id: string;
  keywordId: string;
  domain: string;
  rank: number;
  url?: string;
  searchEngine: 'google' | 'bing' | 'youtube';
  device: 'desktop' | 'mobile';
  location?: string;
  serpFeatures?: string[];
  checkedAt: Date;
  createdAt: Date;
}

export interface CreateRankingInput {
  keywordId: string;
  domain: string;
  rank: number;
  url?: string;
  searchEngine: 'google' | 'bing' | 'youtube';
  device: 'desktop' | 'mobile';
  location?: string;
  serpFeatures?: string[];
  checkedAt?: Date;
}

export interface RankingFilters {
  searchEngine?: string;
  device?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Store a ranking check result
 */
export async function createRanking(input: CreateRankingInput): Promise<Ranking> {
  const {
    keywordId,
    domain,
    rank,
    url,
    searchEngine,
    device,
    location,
    serpFeatures,
    checkedAt
  } = input;

  const query = `
    INSERT INTO rankings (
      keyword_id,
      domain,
      rank,
      url,
      search_engine,
      device,
      location,
      serp_features,
      checked_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (keyword_id, search_engine, device, location, checked_at)
    DO UPDATE SET
      domain = EXCLUDED.domain,
      rank = EXCLUDED.rank,
      url = EXCLUDED.url,
      serp_features = EXCLUDED.serp_features
    RETURNING
      id,
      keyword_id as "keywordId",
      domain,
      rank,
      url,
      search_engine as "searchEngine",
      device,
      location,
      serp_features as "serpFeatures",
      checked_at as "checkedAt",
      created_at as "createdAt"
  `;

  const values = [
    keywordId,
    domain,
    rank,
    url || null,
    searchEngine,
    device,
    location || 'United States',
    serpFeatures || [],
    checkedAt || new Date()
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Bulk insert rankings
 */
export async function bulkCreateRankings(rankings: CreateRankingInput[]): Promise<number> {
  if (rankings.length === 0) return 0;

  const values: any[] = [];
  const placeholders: string[] = [];

  rankings.forEach((ranking, idx) => {
    const offset = idx * 9;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
    );

    values.push(
      ranking.keywordId,
      ranking.domain,
      ranking.rank,
      ranking.url || null,
      ranking.searchEngine,
      ranking.device,
      ranking.location || 'United States',
      ranking.serpFeatures || [],
      ranking.checkedAt || new Date()
    );
  });

  const query = `
    INSERT INTO rankings (
      keyword_id, domain, rank, url, search_engine, device, location, serp_features, checked_at
    )
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (keyword_id, search_engine, device, location, checked_at)
    DO UPDATE SET
      domain = EXCLUDED.domain,
      rank = EXCLUDED.rank,
      url = EXCLUDED.url,
      serp_features = EXCLUDED.serp_features
  `;

  const result = await pool.query(query, values);
  return result.rowCount || 0;
}

/**
 * Get ranking history for a keyword
 */
export async function getKeywordRankingHistory(
  keywordId: string,
  filters: RankingFilters = {},
  limit: number = 100
): Promise<Ranking[]> {
  const whereClauses: string[] = ['keyword_id = $1'];
  const values: any[] = [keywordId];
  let paramCount = 2;

  if (filters.searchEngine) {
    whereClauses.push(`search_engine = $${paramCount}`);
    values.push(filters.searchEngine);
    paramCount++;
  }

  if (filters.device) {
    whereClauses.push(`device = $${paramCount}`);
    values.push(filters.device);
    paramCount++;
  }

  if (filters.location) {
    whereClauses.push(`location = $${paramCount}`);
    values.push(filters.location);
    paramCount++;
  }

  if (filters.startDate) {
    whereClauses.push(`checked_at >= $${paramCount}`);
    values.push(filters.startDate);
    paramCount++;
  }

  if (filters.endDate) {
    whereClauses.push(`checked_at <= $${paramCount}`);
    values.push(filters.endDate);
    paramCount++;
  }

  const whereClause = whereClauses.join(' AND ');

  const query = `
    SELECT
      id,
      keyword_id as "keywordId",
      domain,
      rank,
      url,
      search_engine as "searchEngine",
      device,
      location,
      serp_features as "serpFeatures",
      checked_at as "checkedAt",
      created_at as "createdAt"
    FROM rankings
    WHERE ${whereClause}
    ORDER BY checked_at DESC
    LIMIT $${paramCount}
  `;

  values.push(limit);

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Get the latest ranking for a keyword
 */
export async function getLatestRanking(
  keywordId: string,
  searchEngine: string = 'google',
  device: string = 'desktop',
  location: string = 'United States'
): Promise<Ranking | null> {
  const query = `
    SELECT
      id,
      keyword_id as "keywordId",
      domain,
      rank,
      url,
      search_engine as "searchEngine",
      device,
      location,
      serp_features as "serpFeatures",
      checked_at as "checkedAt",
      created_at as "createdAt"
    FROM rankings
    WHERE keyword_id = $1
      AND search_engine = $2
      AND device = $3
      AND location = $4
    ORDER BY checked_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [keywordId, searchEngine, device, location]);
  return result.rows[0] || null;
}

/**
 * Get rankings for multiple keywords (latest for each)
 */
export async function getLatestRankingsForKeywords(
  keywordIds: string[],
  searchEngine: string = 'google',
  device: string = 'desktop',
  location: string = 'United States'
): Promise<Ranking[]> {
  if (keywordIds.length === 0) return [];

  const query = `
    SELECT DISTINCT ON (keyword_id)
      id,
      keyword_id as "keywordId",
      domain,
      rank,
      url,
      search_engine as "searchEngine",
      device,
      location,
      serp_features as "serpFeatures",
      checked_at as "checkedAt",
      created_at as "createdAt"
    FROM rankings
    WHERE keyword_id = ANY($1)
      AND search_engine = $2
      AND device = $3
      AND location = $4
    ORDER BY keyword_id, checked_at DESC
  `;

  const result = await pool.query(query, [keywordIds, searchEngine, device, location]);
  return result.rows;
}

/**
 * Get ranking changes (compare latest with previous)
 */
export async function getRankingChanges(
  keywordId: string,
  searchEngine: string = 'google',
  device: string = 'desktop',
  location: string = 'United States'
): Promise<{ current: Ranking | null; previous: Ranking | null; change: number | null }> {
  const query = `
    SELECT
      id,
      keyword_id as "keywordId",
      domain,
      rank,
      url,
      search_engine as "searchEngine",
      device,
      location,
      serp_features as "serpFeatures",
      checked_at as "checkedAt",
      created_at as "createdAt"
    FROM rankings
    WHERE keyword_id = $1
      AND search_engine = $2
      AND device = $3
      AND location = $4
    ORDER BY checked_at DESC
    LIMIT 2
  `;

  const result = await pool.query(query, [keywordId, searchEngine, device, location]);

  const current = result.rows[0] || null;
  const previous = result.rows[1] || null;

  let change = null;
  if (current && previous) {
    // Rank decrease means improvement (from 10 to 5 = +5 improvement)
    change = previous.rank - current.rank;
  }

  return { current, previous, change };
}

/**
 * Get competitor rankings for a keyword
 */
export async function getCompetitorRankings(
  keywordId: string,
  competitorDomains: string[],
  searchEngine: string = 'google',
  device: string = 'desktop',
  location: string = 'United States'
): Promise<Ranking[]> {
  if (competitorDomains.length === 0) return [];

  const query = `
    SELECT DISTINCT ON (domain)
      id,
      keyword_id as "keywordId",
      domain,
      rank,
      url,
      search_engine as "searchEngine",
      device,
      location,
      serp_features as "serpFeatures",
      checked_at as "checkedAt",
      created_at as "createdAt"
    FROM rankings
    WHERE keyword_id = $1
      AND domain = ANY($2)
      AND search_engine = $3
      AND device = $4
      AND location = $5
    ORDER BY domain, checked_at DESC
  `;

  const result = await pool.query(query, [
    keywordId,
    competitorDomains,
    searchEngine,
    device,
    location
  ]);

  return result.rows;
}

/**
 * Get average rank for a keyword over a time period
 */
export async function getAverageRank(
  keywordId: string,
  startDate: Date,
  endDate: Date,
  searchEngine: string = 'google',
  device: string = 'desktop',
  location: string = 'United States'
): Promise<number | null> {
  const query = `
    SELECT AVG(rank) as avg_rank
    FROM rankings
    WHERE keyword_id = $1
      AND search_engine = $2
      AND device = $3
      AND location = $4
      AND checked_at >= $5
      AND checked_at <= $6
  `;

  const result = await pool.query(query, [
    keywordId,
    searchEngine,
    device,
    location,
    startDate,
    endDate
  ]);

  const avgRank = result.rows[0]?.avg_rank;
  return avgRank ? parseFloat(avgRank) : null;
}

/**
 * Delete old rankings (for data retention policies)
 */
export async function deleteOldRankings(beforeDate: Date): Promise<number> {
  const query = 'DELETE FROM rankings WHERE checked_at < $1';
  const result = await pool.query(query, [beforeDate]);
  return result.rowCount || 0;
}

/**
 * Get SERP features for a keyword
 */
export async function getSerpFeatures(
  keywordId: string,
  searchEngine: string = 'google',
  device: string = 'desktop',
  location: string = 'United States'
): Promise<{ features: string[]; checkedAt: Date } | null> {
  const query = `
    SELECT
      serp_features as "serpFeatures",
      checked_at as "checkedAt"
    FROM rankings
    WHERE keyword_id = $1
      AND search_engine = $2
      AND device = $3
      AND location = $4
      AND serp_features IS NOT NULL
      AND array_length(serp_features, 1) > 0
    ORDER BY checked_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [keywordId, searchEngine, device, location]);

  if (result.rows.length === 0) return null;

  return {
    features: result.rows[0].serpFeatures || [],
    checkedAt: result.rows[0].checkedAt
  };
}
