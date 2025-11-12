import { pool } from '../config/database';

export interface ExportOptions {
  filters?: Record<string, any>;
  columns?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export type ExportType =
  | 'keywords'
  | 'rankings'
  | 'competitors'
  | 'keyword_lists'
  | 'alert_history'
  | 'projects'
  | 'competitor_analysis';

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: any[], columns?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  // Determine columns to include
  const headers = columns || Object.keys(data[0]);

  // Build CSV header row
  const headerRow = headers.map(escapeCSVField).join(',');

  // Build data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        return escapeCSVField(formatCSVValue(value));
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape and format CSV field
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringValue = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format value for CSV output
 */
function formatCSVValue(value: any): any {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

/**
 * Export keywords to CSV
 */
export async function exportKeywords(
  _userId: string,
  projectId: string,
  options: ExportOptions = {}
): Promise<string> {
  let query = `
    SELECT
      k.id,
      k.keyword,
      k.search_volume,
      k.difficulty,
      k.cpc,
      k.competition,
      k.search_intent,
      k.word_count,
      k.created_at,
      k.updated_at,
      (
        SELECT position
        FROM rankings r
        WHERE r.keyword_id = k.id
        ORDER BY r.checked_at DESC
        LIMIT 1
      ) as current_position
    FROM keywords k
    WHERE k.project_id = $1
  `;

  const values: any[] = [projectId];
  let paramCount = 2;

  // Apply filters
  if (options.filters) {
    if (options.filters.min_search_volume) {
      query += ` AND k.search_volume >= $${paramCount++}`;
      values.push(options.filters.min_search_volume);
    }
    if (options.filters.max_difficulty) {
      query += ` AND k.difficulty <= $${paramCount++}`;
      values.push(options.filters.max_difficulty);
    }
    if (options.filters.search_intent) {
      query += ` AND k.search_intent = $${paramCount++}`;
      values.push(options.filters.search_intent);
    }
    if (options.filters.keyword_search) {
      query += ` AND k.keyword ILIKE $${paramCount++}`;
      values.push(`%${options.filters.keyword_search}%`);
    }
  }

  // Apply sorting
  const sortBy = options.sortBy || 'created_at';
  const sortOrder = options.sortOrder || 'desc';
  query += ` ORDER BY k.${sortBy} ${sortOrder}`;

  // Apply limit
  if (options.limit) {
    query += ` LIMIT $${paramCount++}`;
    values.push(options.limit);
  }

  const result = await pool.query(query, values);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export rankings history to CSV
 */
export async function exportRankings(
  _userId: string,
  keywordId: string,
  options: ExportOptions = {}
): Promise<string> {
  let query = `
    SELECT
      r.id,
      k.keyword,
      k.search_volume,
      r.position,
      r.url,
      r.search_engine,
      r.device_type,
      r.location_code,
      r.serp_features,
      r.checked_at,
      p.domain as project_domain
    FROM rankings r
    INNER JOIN keywords k ON r.keyword_id = k.id
    LEFT JOIN projects p ON k.project_id = p.id
    WHERE r.keyword_id = $1
  `;

  const values: any[] = [keywordId];
  let paramCount = 2;

  // Apply date range filter
  if (options.dateRange) {
    query += ` AND r.checked_at BETWEEN $${paramCount++} AND $${paramCount++}`;
    values.push(options.dateRange.start, options.dateRange.end);
  }

  // Apply filters
  if (options.filters) {
    if (options.filters.search_engine) {
      query += ` AND r.search_engine = $${paramCount++}`;
      values.push(options.filters.search_engine);
    }
    if (options.filters.device_type) {
      query += ` AND r.device_type = $${paramCount++}`;
      values.push(options.filters.device_type);
    }
  }

  query += ` ORDER BY r.checked_at DESC`;

  if (options.limit) {
    query += ` LIMIT $${paramCount++}`;
    values.push(options.limit);
  }

  const result = await pool.query(query, values);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export all rankings for a project
 */
export async function exportProjectRankings(
  _userId: string,
  projectId: string,
  options: ExportOptions = {}
): Promise<string> {
  let query = `
    SELECT
      k.keyword,
      k.search_volume,
      k.difficulty,
      r.position,
      r.url,
      r.search_engine,
      r.device_type,
      r.location_code,
      r.checked_at
    FROM rankings r
    INNER JOIN keywords k ON r.keyword_id = k.id
    WHERE k.project_id = $1
  `;

  const values: any[] = [projectId];
  let paramCount = 2;

  // Apply date range filter
  if (options.dateRange) {
    query += ` AND r.checked_at BETWEEN $${paramCount++} AND $${paramCount++}`;
    values.push(options.dateRange.start, options.dateRange.end);
  }

  // Apply filters
  if (options.filters) {
    if (options.filters.search_engine) {
      query += ` AND r.search_engine = $${paramCount++}`;
      values.push(options.filters.search_engine);
    }
    if (options.filters.device_type) {
      query += ` AND r.device_type = $${paramCount++}`;
      values.push(options.filters.device_type);
    }
  }

  query += ` ORDER BY k.keyword ASC, r.checked_at DESC`;

  if (options.limit) {
    query += ` LIMIT $${paramCount++}`;
    values.push(options.limit);
  }

  const result = await pool.query(query, values);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export competitors to CSV
 */
export async function exportCompetitors(
  _userId: string,
  projectId: string,
  options: ExportOptions = {}
): Promise<string> {
  const query = `
    SELECT
      c.id,
      c.domain,
      c.notes,
      c.created_at,
      COUNT(DISTINCT k.id) as tracked_keywords
    FROM competitors c
    LEFT JOIN keywords k ON k.project_id = c.project_id
    WHERE c.project_id = $1
    GROUP BY c.id, c.domain, c.notes, c.created_at
    ORDER BY c.created_at DESC
  `;

  const result = await pool.query(query, [projectId]);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export keyword list to CSV
 */
export async function exportKeywordList(
  _userId: string,
  listId: string,
  options: ExportOptions = {}
): Promise<string> {
  let query = `
    SELECT
      kli.keyword,
      kli.search_volume,
      kli.cpc,
      kli.competition,
      kli.difficulty,
      kli.intent,
      kli.is_question,
      kli.question_type,
      kli.opportunity_score,
      kli.word_count,
      kli.notes,
      kli.created_at
    FROM keyword_list_items kli
    INNER JOIN keyword_lists kl ON kli.list_id = kl.id
    WHERE kli.list_id = $1 AND kl.user_id = $2
  `;

  const values: any[] = [listId, userId];
  let paramCount = 3;

  // Apply filters
  if (options.filters) {
    if (options.filters.min_search_volume) {
      query += ` AND kli.search_volume >= $${paramCount++}`;
      values.push(options.filters.min_search_volume);
    }
    if (options.filters.intent) {
      query += ` AND kli.intent = $${paramCount++}`;
      values.push(options.filters.intent);
    }
    if (options.filters.is_question !== undefined) {
      query += ` AND kli.is_question = $${paramCount++}`;
      values.push(options.filters.is_question);
    }
  }

  query += ` ORDER BY kli.opportunity_score DESC`;

  if (options.limit) {
    query += ` LIMIT $${paramCount++}`;
    values.push(options.limit);
  }

  const result = await pool.query(query, values);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export alert history to CSV
 */
export async function exportAlertHistory(
  _userId: string,
  projectId?: string,
  options: ExportOptions = {}
): Promise<string> {
  let query = `
    SELECT
      ah.id,
      a.name as alert_name,
      ah.alert_type,
      ah.trigger_data,
      ah.email_sent,
      ah.email_sent_at,
      ah.webhook_sent,
      ah.webhook_sent_at,
      ah.triggered_at
    FROM alert_history ah
    INNER JOIN alerts a ON ah.alert_id = a.id
    WHERE a.user_id = $1
  `;

  const values: any[] = [userId];
  let paramCount = 2;

  if (projectId) {
    query += ` AND a.project_id = $${paramCount++}`;
    values.push(projectId);
  }

  // Apply date range filter
  if (options.dateRange) {
    query += ` AND ah.triggered_at BETWEEN $${paramCount++} AND $${paramCount++}`;
    values.push(options.dateRange.start, options.dateRange.end);
  }

  query += ` ORDER BY ah.triggered_at DESC`;

  if (options.limit) {
    query += ` LIMIT $${paramCount++}`;
    values.push(options.limit);
  }

  const result = await pool.query(query, values);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export projects to CSV
 */
export async function exportProjects(
  userId: string,
  options: ExportOptions = {}
): Promise<string> {
  const query = `
    SELECT
      p.id,
      p.name,
      p.domain,
      p.description,
      p.created_at,
      p.updated_at,
      COUNT(DISTINCT k.id) as total_keywords,
      COUNT(DISTINCT c.id) as total_competitors
    FROM projects p
    LEFT JOIN keywords k ON k.project_id = p.id
    LEFT JOIN competitors c ON c.project_id = p.id
    WHERE p.user_id = $1
    GROUP BY p.id, p.name, p.domain, p.description, p.created_at, p.updated_at
    ORDER BY p.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return arrayToCSV(result.rows, options.columns);
}

/**
 * Export competitor analysis data to CSV
 */
export async function exportCompetitorAnalysis(
  _userId: string,
  _projectId: string,
  _analysisType: 'keyword_gap' | 'quick_wins' | 'visibility',
  options: ExportOptions = {}
): Promise<string> {
  // This would integrate with the competitor analysis service
  // For now, return a placeholder
  const data = [
    {
      keyword: 'example keyword',
      your_position: 15,
      competitor_position: 5,
      gap_type: 'losing',
      search_volume: 1000,
      opportunity_score: 75,
    },
  ];

  return arrayToCSV(data, options.columns);
}

/**
 * Generic export function that routes to specific exporters
 */
export async function exportData(
  exportType: ExportType,
  userId: string,
  entityId: string,
  options: ExportOptions = {}
): Promise<string> {
  switch (exportType) {
    case 'keywords':
      return exportKeywords(userId, entityId, options);

    case 'rankings':
      return exportProjectRankings(userId, entityId, options);

    case 'competitors':
      return exportCompetitors(userId, entityId, options);

    case 'keyword_lists':
      return exportKeywordList(userId, entityId, options);

    case 'alert_history':
      return exportAlertHistory(userId, entityId, options);

    case 'projects':
      return exportProjects(userId, options);

    case 'competitor_analysis':
      return exportCompetitorAnalysis(userId, entityId, 'keyword_gap', options);

    default:
      throw new Error(`Unsupported export type: ${exportType}`);
  }
}
