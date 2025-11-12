import { query } from '../config/database';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  name: string;
  domain: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  domain?: string;
  description?: string;
}

export interface ProjectWithStats extends Project {
  keyword_count?: number;
  competitor_count?: number;
}

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<Project> {
  const { name, domain, description } = input;

  const result = await query<Project>(
    `INSERT INTO projects (user_id, name, domain, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, domain, description || null]
  );

  return result.rows[0];
}

/**
 * Find project by ID
 */
export async function findProjectById(projectId: string): Promise<Project | null> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE id = $1',
    [projectId]
  );

  return result.rows[0] || null;
}

/**
 * Find project by ID and user ID (ensures ownership)
 */
export async function findProjectByIdAndUserId(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  return result.rows[0] || null;
}

/**
 * Get all projects for a user with pagination
 */
export async function getProjectsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ projects: ProjectWithStats[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * limit;

  // Get projects with keyword and competitor counts
  const projectsResult = await query<ProjectWithStats>(
    `SELECT
       p.*,
       COUNT(DISTINCT k.id) as keyword_count,
       COUNT(DISTINCT c.id) as competitor_count
     FROM projects p
     LEFT JOIN keywords k ON k.project_id = p.id
     LEFT JOIN competitors c ON c.project_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Get total count
  const countResult = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
    [userId]
  );

  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  return {
    projects: projectsResult.rows,
    total,
    page,
    totalPages,
  };
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<Project> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }

  if (input.domain !== undefined) {
    updates.push(`domain = $${paramIndex++}`);
    values.push(input.domain);
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(projectId, userId);

  const result = await query<Project>(
    `UPDATE projects
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Project not found or access denied');
  }

  return result.rows[0];
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const result = await query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Project not found or access denied');
  }
}

/**
 * Check if user owns a project
 */
export async function userOwnsProject(projectId: string, userId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM projects
       WHERE id = $1 AND user_id = $2
     ) as exists`,
    [projectId, userId]
  );

  return result.rows[0].exists;
}

/**
 * Get project count for a user
 */
export async function getProjectCount(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
    [userId]
  );

  return parseInt(result.rows[0].count);
}

/**
 * Find project by domain and user
 */
export async function findProjectByDomain(
  userId: string,
  domain: string
): Promise<Project | null> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE user_id = $1 AND domain = $2',
    [userId, domain]
  );

  return result.rows[0] || null;
}

/**
 * Check if domain already exists for user
 */
export async function domainExists(userId: string, domain: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM projects
       WHERE user_id = $1 AND domain = $2
     ) as exists`,
    [userId, domain]
  );

  return result.rows[0].exists;
}
