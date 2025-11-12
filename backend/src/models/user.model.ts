import { query, transaction } from '../config/database';
import { PoolClient } from 'pg';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new user (legacy - for non-Supabase auth)
 */
export async function createUser(
  email: string,
  passwordHash: string
): Promise<UserDTO> {
  const result = await query<User>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at, updated_at`,
    [email, passwordHash]
  );

  return result.rows[0];
}

/**
 * Create a user from Supabase Auth
 * Uses Supabase user ID and doesn't require password hash
 */
export async function createUserFromSupabase(
  supabaseUserId: string,
  email: string
): Promise<UserDTO> {
  const result = await query<UserDTO>(
    `INSERT INTO users (id, email, password_hash)
     VALUES ($1, $2, '')
     ON CONFLICT (id) DO UPDATE
     SET email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, email, created_at, updated_at`,
    [supabaseUserId, email]
  );

  return result.rows[0];
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Find user by ID (without password hash)
 */
export async function findUserByIdSafe(id: string): Promise<UserDTO | null> {
  const result = await query<UserDTO>(
    'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Update user email
 */
export async function updateUserEmail(
  id: string,
  newEmail: string
): Promise<UserDTO> {
  const result = await query<UserDTO>(
    `UPDATE users
     SET email = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, created_at, updated_at`,
    [newEmail, id]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
}

/**
 * Update user password
 */
export async function updateUserPassword(
  id: string,
  newPasswordHash: string
): Promise<void> {
  const result = await query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2`,
    [newPasswordHash, id]
  );

  if (result.rowCount === 0) {
    throw new Error('User not found');
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  const result = await query('DELETE FROM users WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    throw new Error('User not found');
  }
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
    [email]
  );

  return result.rows[0].exists;
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM users'
  );

  return parseInt(result.rows[0].count);
}

/**
 * Remove password hash from user object
 */
export function toUserDTO(user: User): UserDTO {
  const { password_hash, ...userDTO } = user;
  return userDTO;
}
