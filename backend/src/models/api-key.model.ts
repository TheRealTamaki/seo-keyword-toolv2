import { query } from '../config/database';
import { encrypt, decrypt, hashApiKey } from '../services/encryption.service';

export interface ApiKey {
  id: string;
  user_id: string;
  api_key_encrypted: string;
  api_key_hash: string;
  is_active: boolean;
  created_at: Date;
  last_validated_at: Date | null;
  validated_successfully: boolean;
}

export interface ApiKeyDTO {
  id: string;
  user_id: string;
  is_active: boolean;
  created_at: Date;
  last_validated_at: Date | null;
  validated_successfully: boolean;
}

/**
 * Create or update API key for a user
 * Encrypts the API key before storing
 */
export async function upsertApiKey(
  userId: string,
  apiKey: string
): Promise<ApiKeyDTO> {
  const encrypted = encrypt(apiKey);
  const hash = hashApiKey(apiKey);

  const result = await query<ApiKeyDTO>(
    `INSERT INTO api_keys (user_id, api_key_encrypted, api_key_hash, is_active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (user_id)
     DO UPDATE SET
       api_key_encrypted = EXCLUDED.api_key_encrypted,
       api_key_hash = EXCLUDED.api_key_hash,
       is_active = true,
       created_at = NOW()
     RETURNING id, user_id, is_active, created_at, last_validated_at, validated_successfully`,
    [userId, encrypted, hash]
  );

  return result.rows[0];
}

/**
 * Find API key by user ID
 */
export async function findApiKeyByUserId(userId: string): Promise<ApiKey | null> {
  const result = await query<ApiKey>(
    'SELECT * FROM api_keys WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Get decrypted API key for a user
 */
export async function getDecryptedApiKey(userId: string): Promise<string | null> {
  const apiKeyRecord = await findApiKeyByUserId(userId);

  if (!apiKeyRecord || !apiKeyRecord.is_active) {
    return null;
  }

  try {
    return decrypt(apiKeyRecord.api_key_encrypted);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return null;
  }
}

/**
 * Update API key validation status
 */
export async function updateValidationStatus(
  userId: string,
  isValid: boolean
): Promise<void> {
  await query(
    `UPDATE api_keys
     SET last_validated_at = NOW(),
         validated_successfully = $1
     WHERE user_id = $2`,
    [isValid, userId]
  );
}

/**
 * Deactivate API key
 */
export async function deactivateApiKey(userId: string): Promise<void> {
  await query(
    'UPDATE api_keys SET is_active = false WHERE user_id = $1',
    [userId]
  );
}

/**
 * Delete API key
 */
export async function deleteApiKey(userId: string): Promise<void> {
  const result = await query(
    'DELETE FROM api_keys WHERE user_id = $1',
    [userId]
  );

  if (result.rowCount === 0) {
    throw new Error('API key not found');
  }
}

/**
 * Check if user has an active API key
 */
export async function hasActiveApiKey(userId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM api_keys
       WHERE user_id = $1 AND is_active = true
     ) as exists`,
    [userId]
  );

  return result.rows[0].exists;
}

/**
 * Get API key info without decrypting (safe for API responses)
 */
export async function getApiKeyInfo(userId: string): Promise<ApiKeyDTO | null> {
  const result = await query<ApiKeyDTO>(
    `SELECT id, user_id, is_active, created_at, last_validated_at, validated_successfully
     FROM api_keys
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Get count of active API keys
 */
export async function getActiveApiKeyCount(): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM api_keys WHERE is_active = true'
  );

  return parseInt(result.rows[0].count);
}
