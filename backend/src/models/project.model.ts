import pool from '../config/database';

export interface Project {
  id: string;
  userId: string;
  name: string;
  domain: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  domain: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  domain?: string;
  description?: string;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { userId, name, domain, description } = input;

  const query = `
    INSERT INTO projects (user_id, name, domain, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id as "userId", name, domain, description, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [userId, name, domain, description || null];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('A project with this domain already exists for your account');
    }
    throw error;
  }
}

/**
 * Get all projects for a user with pagination
 */
export async function getUserProjects(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResult<Project>> {
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = 'SELECT COUNT(*) FROM projects WHERE user_id = $1';
  const countResult = await pool.query(countQuery, [userId]);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated projects
  const query = `
    SELECT
      id,
      user_id as "userId",
      name,
      domain,
      description,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM projects
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, [userId, limit, offset]);

  return {
    data: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get a single project by ID
 */
export async function getProjectById(projectId: string, userId: string): Promise<Project | null> {
  const query = `
    SELECT
      id,
      user_id as "userId",
      name,
      domain,
      description,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM projects
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [projectId, userId]);
  return result.rows[0] || null;
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  updates: UpdateProjectInput
): Promise<Project | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount}`);
    values.push(updates.name);
    paramCount++;
  }

  if (updates.domain !== undefined) {
    fields.push(`domain = $${paramCount}`);
    values.push(updates.domain);
    paramCount++;
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount}`);
    values.push(updates.description);
    paramCount++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Add updated_at
  fields.push(`updated_at = NOW()`);

  // Add WHERE clause params
  values.push(projectId, userId);

  const query = `
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING id, user_id as "userId", name, domain, description, created_at as "createdAt", updated_at as "updatedAt"
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('A project with this domain already exists for your account');
    }
    throw error;
  }
}

/**
 * Delete a project (cascades to keywords, rankings, etc.)
 */
export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM projects WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [projectId, userId]);
  return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Check if a project exists and belongs to the user
 */
export async function projectExists(projectId: string, userId: string): Promise<boolean> {
  const query = 'SELECT id FROM projects WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [projectId, userId]);
  return result.rows.length > 0;
}

/**
 * Get project statistics (keyword count, competitor count, etc.)
 */
export async function getProjectStats(projectId: string, userId: string) {
  const query = `
    SELECT
      p.id,
      p.name,
      p.domain,
      (SELECT COUNT(*) FROM keywords WHERE project_id = p.id) as keyword_count,
      (SELECT COUNT(*) FROM competitors WHERE project_id = p.id) as competitor_count,
      (SELECT COUNT(*) FROM keyword_lists WHERE project_id = p.id) as list_count
    FROM projects p
    WHERE p.id = $1 AND p.user_id = $2
  `;

  const result = await pool.query(query, [projectId, userId]);
  return result.rows[0] || null;
}
