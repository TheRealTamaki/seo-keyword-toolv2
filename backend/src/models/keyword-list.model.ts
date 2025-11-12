import { pool } from '../config/database';

export interface KeywordList {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordListItem {
  id: string;
  listId: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent?: string;
  isQuestion: boolean;
  questionType?: string;
  opportunityScore: number;
  wordCount: number;
  trends?: number[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordListWithStats extends KeywordList {
  itemCount: number;
  avgSearchVolume: number;
  avgDifficulty: number;
  avgOpportunityScore: number;
}

/**
 * Create a new keyword list
 */
export async function createKeywordList(data: {
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
}): Promise<KeywordList> {
  const { userId, projectId, name, description } = data;

  const result = await pool.query(
    `INSERT INTO keyword_lists (user_id, project_id, name, description)
     VALUES ($1, $2, $3, $4)
     RETURNING
       id,
       user_id as "userId",
       project_id as "projectId",
       name,
       description,
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    [userId, projectId || null, name, description || null]
  );

  return result.rows[0];
}

/**
 * Get keyword list by ID
 */
export async function getKeywordListById(
  listId: string,
  userId: string
): Promise<KeywordList | null> {
  const result = await pool.query(
    `SELECT
       id,
       user_id as "userId",
       project_id as "projectId",
       name,
       description,
       created_at as "createdAt",
       updated_at as "updatedAt"
     FROM keyword_lists
     WHERE id = $1 AND user_id = $2`,
    [listId, userId]
  );

  return result.rows[0] || null;
}

/**
 * Get keyword lists for a user with stats
 */
export async function getUserKeywordLists(
  userId: string,
  projectId?: string
): Promise<KeywordListWithStats[]> {
  const query = projectId
    ? `SELECT
         kl.id,
         kl.user_id as "userId",
         kl.project_id as "projectId",
         kl.name,
         kl.description,
         kl.created_at as "createdAt",
         kl.updated_at as "updatedAt",
         COUNT(kli.id)::INTEGER as "itemCount",
         COALESCE(AVG(kli.search_volume)::INTEGER, 0) as "avgSearchVolume",
         COALESCE(AVG(kli.difficulty)::INTEGER, 0) as "avgDifficulty",
         COALESCE(AVG(kli.opportunity_score)::INTEGER, 0) as "avgOpportunityScore"
       FROM keyword_lists kl
       LEFT JOIN keyword_list_items kli ON kl.id = kli.list_id
       WHERE kl.user_id = $1 AND kl.project_id = $2
       GROUP BY kl.id
       ORDER BY kl.updated_at DESC`
    : `SELECT
         kl.id,
         kl.user_id as "userId",
         kl.project_id as "projectId",
         kl.name,
         kl.description,
         kl.created_at as "createdAt",
         kl.updated_at as "updatedAt",
         COUNT(kli.id)::INTEGER as "itemCount",
         COALESCE(AVG(kli.search_volume)::INTEGER, 0) as "avgSearchVolume",
         COALESCE(AVG(kli.difficulty)::INTEGER, 0) as "avgDifficulty",
         COALESCE(AVG(kli.opportunity_score)::INTEGER, 0) as "avgOpportunityScore"
       FROM keyword_lists kl
       LEFT JOIN keyword_list_items kli ON kl.id = kli.list_id
       WHERE kl.user_id = $1
       GROUP BY kl.id
       ORDER BY kl.updated_at DESC`;

  const params = projectId ? [userId, projectId] : [userId];
  const result = await pool.query(query, params);

  return result.rows;
}

/**
 * Update keyword list
 */
export async function updateKeywordList(
  listId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    projectId?: string;
  }
): Promise<KeywordList | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }

  if (updates.projectId !== undefined) {
    fields.push(`project_id = $${paramIndex++}`);
    values.push(updates.projectId);
  }

  if (fields.length === 0) {
    return await getKeywordListById(listId, userId);
  }

  values.push(listId, userId);

  const result = await pool.query(
    `UPDATE keyword_lists
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
     RETURNING
       id,
       user_id as "userId",
       project_id as "projectId",
       name,
       description,
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Delete keyword list
 */
export async function deleteKeywordList(
  listId: string,
  userId: string
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM keyword_lists
     WHERE id = $1 AND user_id = $2`,
    [listId, userId]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Add keywords to a list
 */
export async function addKeywordsToList(
  listId: string,
  keywords: Array<{
    keyword: string;
    searchVolume?: number;
    cpc?: number;
    competition?: number;
    difficulty?: number;
    intent?: string;
    isQuestion?: boolean;
    questionType?: string;
    opportunityScore?: number;
    wordCount?: number;
    trends?: number[];
    notes?: string;
  }>
): Promise<KeywordListItem[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertedItems: KeywordListItem[] = [];

    for (const kw of keywords) {
      const result = await client.query(
        `INSERT INTO keyword_list_items (
          list_id,
          keyword,
          search_volume,
          cpc,
          competition,
          difficulty,
          intent,
          is_question,
          question_type,
          opportunity_score,
          word_count,
          trends,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING
          id,
          list_id as "listId",
          keyword,
          search_volume as "searchVolume",
          cpc,
          competition,
          difficulty,
          intent,
          is_question as "isQuestion",
          question_type as "questionType",
          opportunity_score as "opportunityScore",
          word_count as "wordCount",
          trends,
          notes,
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        [
          listId,
          kw.keyword,
          kw.searchVolume || 0,
          kw.cpc || 0,
          kw.competition || 0,
          kw.difficulty || 0,
          kw.intent || null,
          kw.isQuestion || false,
          kw.questionType || null,
          kw.opportunityScore || 0,
          kw.wordCount || kw.keyword.trim().split(/\s+/).length,
          kw.trends ? JSON.stringify(kw.trends) : null,
          kw.notes || null,
        ]
      );

      insertedItems.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return insertedItems;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get keywords from a list with filters
 */
export async function getKeywordListItems(
  listId: string,
  filters: {
    minSearchVolume?: number;
    maxSearchVolume?: number;
    minDifficulty?: number;
    maxDifficulty?: number;
    intent?: string;
    questionsOnly?: boolean;
    searchTerm?: string;
  } = {},
  sortBy: string = 'opportunity_score',
  sortOrder: 'ASC' | 'DESC' = 'DESC',
  page: number = 1,
  limit: number = 50
): Promise<{ items: KeywordListItem[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * limit;
  const whereClauses: string[] = ['list_id = $1'];
  const params: any[] = [listId];
  let paramIndex = 2;

  if (filters.minSearchVolume !== undefined) {
    whereClauses.push(`search_volume >= $${paramIndex++}`);
    params.push(filters.minSearchVolume);
  }

  if (filters.maxSearchVolume !== undefined) {
    whereClauses.push(`search_volume <= $${paramIndex++}`);
    params.push(filters.maxSearchVolume);
  }

  if (filters.minDifficulty !== undefined) {
    whereClauses.push(`difficulty >= $${paramIndex++}`);
    params.push(filters.minDifficulty);
  }

  if (filters.maxDifficulty !== undefined) {
    whereClauses.push(`difficulty <= $${paramIndex++}`);
    params.push(filters.maxDifficulty);
  }

  if (filters.intent) {
    whereClauses.push(`intent = $${paramIndex++}`);
    params.push(filters.intent);
  }

  if (filters.questionsOnly) {
    whereClauses.push('is_question = true');
  }

  if (filters.searchTerm) {
    whereClauses.push(`keyword ILIKE $${paramIndex++}`);
    params.push(`%${filters.searchTerm}%`);
  }

  const whereClause = whereClauses.join(' AND ');

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM keyword_list_items WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get items
  const validSortColumns = [
    'keyword',
    'search_volume',
    'cpc',
    'difficulty',
    'opportunity_score',
    'created_at',
  ];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'opportunity_score';

  const itemsResult = await pool.query(
    `SELECT
       id,
       list_id as "listId",
       keyword,
       search_volume as "searchVolume",
       cpc,
       competition,
       difficulty,
       intent,
       is_question as "isQuestion",
       question_type as "questionType",
       opportunity_score as "opportunityScore",
       word_count as "wordCount",
       trends,
       notes,
       created_at as "createdAt",
       updated_at as "updatedAt"
     FROM keyword_list_items
     WHERE ${whereClause}
     ORDER BY ${sortColumn} ${sortOrder}
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return {
    items: itemsResult.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update keyword list item
 */
export async function updateKeywordListItem(
  itemId: string,
  updates: {
    notes?: string;
    searchVolume?: number;
    difficulty?: number;
    opportunityScore?: number;
  }
): Promise<KeywordListItem | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }

  if (updates.searchVolume !== undefined) {
    fields.push(`search_volume = $${paramIndex++}`);
    values.push(updates.searchVolume);
  }

  if (updates.difficulty !== undefined) {
    fields.push(`difficulty = $${paramIndex++}`);
    values.push(updates.difficulty);
  }

  if (updates.opportunityScore !== undefined) {
    fields.push(`opportunity_score = $${paramIndex++}`);
    values.push(updates.opportunityScore);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(itemId);

  const result = await pool.query(
    `UPDATE keyword_list_items
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex++}
     RETURNING
       id,
       list_id as "listId",
       keyword,
       search_volume as "searchVolume",
       cpc,
       competition,
       difficulty,
       intent,
       is_question as "isQuestion",
       question_type as "questionType",
       opportunity_score as "opportunityScore",
       word_count as "wordCount",
       trends,
       notes,
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Delete keyword from list
 */
export async function deleteKeywordListItem(itemId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM keyword_list_items WHERE id = $1`,
    [itemId]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Delete multiple keywords from list
 */
export async function deleteKeywordListItems(itemIds: string[]): Promise<number> {
  const result = await pool.query(
    `DELETE FROM keyword_list_items WHERE id = ANY($1)`,
    [itemIds]
  );

  return result.rowCount || 0;
}

/**
 * Export keyword list items as CSV string
 */
export async function exportKeywordListAsCSV(listId: string): Promise<string> {
  const result = await pool.query(
    `SELECT
       keyword,
       search_volume,
       cpc,
       competition,
       difficulty,
       intent,
       is_question,
       question_type,
       opportunity_score,
       word_count,
       notes
     FROM keyword_list_items
     WHERE list_id = $1
     ORDER BY opportunity_score DESC`,
    [listId]
  );

  const headers = [
    'Keyword',
    'Search Volume',
    'CPC',
    'Competition',
    'Difficulty',
    'Intent',
    'Is Question',
    'Question Type',
    'Opportunity Score',
    'Word Count',
    'Notes',
  ];

  const rows = result.rows.map((row) =>
    [
      `"${row.keyword.replace(/"/g, '""')}"`,
      row.search_volume,
      row.cpc,
      row.competition,
      row.difficulty,
      row.intent || '',
      row.is_question ? 'Yes' : 'No',
      row.question_type || '',
      row.opportunity_score,
      row.word_count,
      row.notes ? `"${row.notes.replace(/"/g, '""')}"` : '',
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
