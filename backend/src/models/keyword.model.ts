import pool from '../config/database';

export interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKeywordInput {
  projectId: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
}

export interface UpdateKeywordInput {
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
}

export interface KeywordFilters {
  searchVolumeMin?: number;
  searchVolumeMax?: number;
  difficultyMin?: number;
  difficultyMax?: number;
  cpcMin?: number;
  cpcMax?: number;
  intent?: string;
  search?: string; // Search in keyword text
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Create a new keyword
 */
export async function createKeyword(input: CreateKeywordInput): Promise<Keyword> {
  const { projectId, keyword, searchVolume, difficulty, cpc, intent } = input;

  const query = `
    INSERT INTO keywords (project_id, keyword, search_volume, difficulty, cpc, intent)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      project_id as "projectId",
      keyword,
      search_volume as "searchVolume",
      difficulty,
      cpc,
      intent,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  const values = [projectId, keyword.toLowerCase().trim(), searchVolume, difficulty, cpc, intent];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('This keyword already exists in the project');
    }
    if (error.code === '23503') {
      throw new Error('Project not found');
    }
    throw error;
  }
}

/**
 * Bulk create keywords
 */
export async function bulkCreateKeywords(
  projectId: string,
  keywords: string[]
): Promise<{ created: Keyword[]; errors: string[] }> {
  const created: Keyword[] = [];
  const errors: string[] = [];

  for (const keyword of keywords) {
    try {
      const result = await createKeyword({
        projectId,
        keyword: keyword.trim()
      });
      created.push(result);
    } catch (error: any) {
      errors.push(`${keyword}: ${error.message}`);
    }
  }

  return { created, errors };
}

/**
 * Get all keywords for a project with filters and pagination
 */
export async function getProjectKeywords(
  projectId: string,
  filters: KeywordFilters = {},
  page: number = 1,
  limit: number = 50,
  sortBy: string = 'created_at',
  order: 'ASC' | 'DESC' = 'DESC'
): Promise<PaginationResult<Keyword>> {
  const offset = (page - 1) * limit;
  const whereClauses: string[] = ['project_id = $1'];
  const values: any[] = [projectId];
  let paramCount = 2;

  // Apply filters
  if (filters.searchVolumeMin !== undefined) {
    whereClauses.push(`search_volume >= $${paramCount}`);
    values.push(filters.searchVolumeMin);
    paramCount++;
  }

  if (filters.searchVolumeMax !== undefined) {
    whereClauses.push(`search_volume <= $${paramCount}`);
    values.push(filters.searchVolumeMax);
    paramCount++;
  }

  if (filters.difficultyMin !== undefined) {
    whereClauses.push(`difficulty >= $${paramCount}`);
    values.push(filters.difficultyMin);
    paramCount++;
  }

  if (filters.difficultyMax !== undefined) {
    whereClauses.push(`difficulty <= $${paramCount}`);
    values.push(filters.difficultyMax);
    paramCount++;
  }

  if (filters.cpcMin !== undefined) {
    whereClauses.push(`cpc >= $${paramCount}`);
    values.push(filters.cpcMin);
    paramCount++;
  }

  if (filters.cpcMax !== undefined) {
    whereClauses.push(`cpc <= $${paramCount}`);
    values.push(filters.cpcMax);
    paramCount++;
  }

  if (filters.intent) {
    whereClauses.push(`intent = $${paramCount}`);
    values.push(filters.intent);
    paramCount++;
  }

  if (filters.search) {
    whereClauses.push(`keyword ILIKE $${paramCount}`);
    values.push(`%${filters.search}%`);
    paramCount++;
  }

  const whereClause = whereClauses.join(' AND ');

  // Validate sortBy to prevent SQL injection
  const allowedSortFields = ['keyword', 'search_volume', 'difficulty', 'cpc', 'created_at', 'updated_at'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM keywords WHERE ${whereClause}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated keywords
  const query = `
    SELECT
      id,
      project_id as "projectId",
      keyword,
      search_volume as "searchVolume",
      difficulty,
      cpc,
      intent,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM keywords
    WHERE ${whereClause}
    ORDER BY ${sortField} ${order}
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);

  const result = await pool.query(query, values);

  return {
    data: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get a single keyword by ID
 */
export async function getKeywordById(keywordId: string): Promise<Keyword | null> {
  const query = `
    SELECT
      id,
      project_id as "projectId",
      keyword,
      search_volume as "searchVolume",
      difficulty,
      cpc,
      intent,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM keywords
    WHERE id = $1
  `;

  const result = await pool.query(query, [keywordId]);
  return result.rows[0] || null;
}

/**
 * Update a keyword
 */
export async function updateKeyword(
  keywordId: string,
  updates: UpdateKeywordInput
): Promise<Keyword | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.searchVolume !== undefined) {
    fields.push(`search_volume = $${paramCount}`);
    values.push(updates.searchVolume);
    paramCount++;
  }

  if (updates.difficulty !== undefined) {
    fields.push(`difficulty = $${paramCount}`);
    values.push(updates.difficulty);
    paramCount++;
  }

  if (updates.cpc !== undefined) {
    fields.push(`cpc = $${paramCount}`);
    values.push(updates.cpc);
    paramCount++;
  }

  if (updates.intent !== undefined) {
    fields.push(`intent = $${paramCount}`);
    values.push(updates.intent);
    paramCount++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Add updated_at
  fields.push(`updated_at = NOW()`);

  // Add WHERE clause param
  values.push(keywordId);

  const query = `
    UPDATE keywords
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id,
      project_id as "projectId",
      keyword,
      search_volume as "searchVolume",
      difficulty,
      cpc,
      intent,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a keyword (cascades to rankings)
 */
export async function deleteKeyword(keywordId: string): Promise<boolean> {
  const query = 'DELETE FROM keywords WHERE id = $1';
  const result = await pool.query(query, [keywordId]);
  return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Check if a keyword exists in a project
 */
export async function keywordExists(projectId: string, keyword: string): Promise<boolean> {
  const query = 'SELECT id FROM keywords WHERE project_id = $1 AND keyword = $2';
  const result = await pool.query(query, [projectId, keyword.toLowerCase().trim()]);
  return result.rows.length > 0;
}

/**
 * Get keyword with latest ranking data
 */
export async function getKeywordWithLatestRank(keywordId: string) {
  const query = `
    SELECT
      k.id,
      k.project_id as "projectId",
      k.keyword,
      k.search_volume as "searchVolume",
      k.difficulty,
      k.cpc,
      k.intent,
      k.created_at as "createdAt",
      k.updated_at as "updatedAt",
      (
        SELECT json_agg(rank_data)
        FROM (
          SELECT DISTINCT ON (search_engine, device, location)
            rank,
            url,
            search_engine as "searchEngine",
            device,
            location,
            serp_features as "serpFeatures",
            checked_at as "checkedAt"
          FROM rankings
          WHERE keyword_id = k.id
          ORDER BY search_engine, device, location, checked_at DESC
        ) rank_data
      ) as "latestRankings"
    FROM keywords k
    WHERE k.id = $1
  `;

  const result = await pool.query(query, [keywordId]);
  return result.rows[0] || null;
}

/**
 * Get keywords without any ranking data (never checked)
 */
export async function getUntrackedKeywords(projectId: string): Promise<Keyword[]> {
  const query = `
    SELECT
      k.id,
      k.project_id as "projectId",
      k.keyword,
      k.search_volume as "searchVolume",
      k.difficulty,
      k.cpc,
      k.intent,
      k.created_at as "createdAt",
      k.updated_at as "updatedAt"
    FROM keywords k
    LEFT JOIN rankings r ON k.id = r.keyword_id
    WHERE k.project_id = $1 AND r.id IS NULL
    ORDER BY k.created_at ASC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
}
