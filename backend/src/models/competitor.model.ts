import { pool } from '../config/database';

export interface Competitor {
  id: string;
  projectId: string;
  domain: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompetitorInput {
  projectId: string;
  domain: string;
  name?: string;
}

export interface UpdateCompetitorInput {
  domain?: string;
  name?: string;
}

/**
 * Create a new competitor
 */
export async function createCompetitor(input: CreateCompetitorInput): Promise<Competitor> {
  const { projectId, domain, name } = input;

  // Clean domain (remove protocol and trailing slashes)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .trim();

  const query = `
    INSERT INTO competitors (project_id, domain, name)
    VALUES ($1, $2, $3)
    RETURNING
      id,
      project_id as "projectId",
      domain,
      name,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  const values = [projectId, cleanDomain, name || cleanDomain];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('This competitor already exists in the project');
    }
    if (error.code === '23503') {
      throw new Error('Project not found');
    }
    throw error;
  }
}

/**
 * Get all competitors for a project
 */
export async function getProjectCompetitors(projectId: string): Promise<Competitor[]> {
  const query = `
    SELECT
      id,
      project_id as "projectId",
      domain,
      name,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM competitors
    WHERE project_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
}

/**
 * Get a single competitor by ID
 */
export async function getCompetitorById(competitorId: string): Promise<Competitor | null> {
  const query = `
    SELECT
      id,
      project_id as "projectId",
      domain,
      name,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM competitors
    WHERE id = $1
  `;

  const result = await pool.query(query, [competitorId]);
  return result.rows[0] || null;
}

/**
 * Update a competitor
 */
export async function updateCompetitor(
  competitorId: string,
  updates: UpdateCompetitorInput
): Promise<Competitor | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.domain !== undefined) {
    // Clean domain
    const cleanDomain = updates.domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .toLowerCase()
      .trim();
    fields.push(`domain = $${paramCount}`);
    values.push(cleanDomain);
    paramCount++;
  }

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount}`);
    values.push(updates.name);
    paramCount++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Add updated_at
  fields.push(`updated_at = NOW()`);

  // Add WHERE clause param
  values.push(competitorId);

  const query = `
    UPDATE competitors
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id,
      project_id as "projectId",
      domain,
      name,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('This competitor already exists in the project');
    }
    throw error;
  }
}

/**
 * Delete a competitor
 */
export async function deleteCompetitor(competitorId: string): Promise<boolean> {
  const query = 'DELETE FROM competitors WHERE id = $1';
  const result = await pool.query(query, [competitorId]);
  return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Check if a competitor exists in a project
 */
export async function competitorExists(projectId: string, domain: string): Promise<boolean> {
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .trim();

  const query = 'SELECT id FROM competitors WHERE project_id = $1 AND domain = $2';
  const result = await pool.query(query, [projectId, cleanDomain]);
  return result.rows.length > 0;
}

/**
 * Get competitor count for a project
 */
export async function getCompetitorCount(projectId: string): Promise<number> {
  const query = 'SELECT COUNT(*) FROM competitors WHERE project_id = $1';
  const result = await pool.query(query, [projectId]);
  return parseInt(result.rows[0].count);
}

/**
 * Bulk add competitors
 */
export async function bulkCreateCompetitors(
  projectId: string,
  competitors: Array<{ domain: string; name?: string }>
): Promise<{ created: Competitor[]; errors: string[] }> {
  const created: Competitor[] = [];
  const errors: string[] = [];

  for (const competitor of competitors) {
    try {
      const result = await createCompetitor({
        projectId,
        domain: competitor.domain,
        name: competitor.name
      });
      created.push(result);
    } catch (error: any) {
      errors.push(`${competitor.domain}: ${error.message}`);
    }
  }

  return { created, errors };
}
