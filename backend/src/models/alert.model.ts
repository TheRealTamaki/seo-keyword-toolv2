import { pool } from '../config/database';

// Types
export type AlertType =
  | 'rank_change'
  | 'rank_improvement'
  | 'rank_drop'
  | 'serp_feature'
  | 'competitor_movement'
  | 'new_ranking'
  | 'lost_ranking';

export type NotificationFrequency = 'immediate' | 'daily_digest' | 'weekly_digest';
export type WebhookType = 'slack' | 'discord' | 'custom';

export interface Alert {
  id: string;
  userId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  alertType: AlertType;
  conditions: Record<string, any>;
  keywordFilters: Record<string, any>;
  enabled: boolean;
  emailEnabled: boolean;
  emailAddresses: string[] | null;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  webhookType: WebhookType | null;
  webhookConfig: Record<string, any>;
  notificationFrequency: NotificationFrequency;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  keywordId: string | null;
  rankingId: string | null;
  alertType: AlertType;
  triggerData: Record<string, any>;
  emailSent: boolean;
  emailSentAt: Date | null;
  webhookSent: boolean;
  webhookSentAt: Date | null;
  webhookResponseCode: number | null;
  notificationErrors: any[];
  triggeredAt: Date;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotificationsEnabled: boolean;
  webhookNotificationsEnabled: boolean;
  defaultEmailAddresses: string[] | null;
  emailFromName: string | null;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string | null;
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: number | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlertInput {
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
  alertType: AlertType;
  conditions: Record<string, any>;
  keywordFilters?: Record<string, any>;
  enabled?: boolean;
  emailEnabled?: boolean;
  emailAddresses?: string[];
  webhookEnabled?: boolean;
  webhookUrl?: string;
  webhookType?: WebhookType;
  webhookConfig?: Record<string, any>;
  notificationFrequency?: NotificationFrequency;
}

export interface UpdateAlertInput {
  name?: string;
  description?: string;
  conditions?: Record<string, any>;
  keywordFilters?: Record<string, any>;
  enabled?: boolean;
  emailEnabled?: boolean;
  emailAddresses?: string[];
  webhookEnabled?: boolean;
  webhookUrl?: string;
  webhookType?: WebhookType;
  webhookConfig?: Record<string, any>;
  notificationFrequency?: NotificationFrequency;
}

/**
 * Create a new alert configuration
 */
export async function createAlert(data: CreateAlertInput): Promise<Alert> {
  const query = `
    INSERT INTO alerts (
      user_id, project_id, name, description, alert_type, conditions,
      keyword_filters, enabled, email_enabled, email_addresses,
      webhook_enabled, webhook_url, webhook_type, webhook_config,
      notification_frequency
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    data.userId,
    data.projectId || null,
    data.name,
    data.description || null,
    data.alertType,
    JSON.stringify(data.conditions),
    JSON.stringify(data.keywordFilters || {}),
    data.enabled !== undefined ? data.enabled : true,
    data.emailEnabled || false,
    data.emailAddresses || null,
    data.webhookEnabled || false,
    data.webhookUrl || null,
    data.webhookType || null,
    JSON.stringify(data.webhookConfig || {}),
    data.notificationFrequency || 'immediate',
  ];

  const result = await pool.query(query, values);
  return mapAlertFromDb(result.rows[0]);
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(
  userId: string,
  projectId?: string
): Promise<Alert[]> {
  let query = `
    SELECT * FROM alerts
    WHERE user_id = $1
  `;
  const values: any[] = [userId];

  if (projectId) {
    query += ' AND project_id = $2';
    values.push(projectId);
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, values);
  return result.rows.map(mapAlertFromDb);
}

/**
 * Get alert by ID
 */
export async function getAlertById(alertId: string, userId: string): Promise<Alert | null> {
  const query = `
    SELECT * FROM alerts
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [alertId, userId]);
  return result.rows.length > 0 ? mapAlertFromDb(result.rows[0]) : null;
}

/**
 * Update an alert
 */
export async function updateAlert(
  alertId: string,
  userId: string,
  data: UpdateAlertInput
): Promise<Alert | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description);
  }
  if (data.conditions !== undefined) {
    updates.push(`conditions = $${paramCount++}`);
    values.push(JSON.stringify(data.conditions));
  }
  if (data.keywordFilters !== undefined) {
    updates.push(`keyword_filters = $${paramCount++}`);
    values.push(JSON.stringify(data.keywordFilters));
  }
  if (data.enabled !== undefined) {
    updates.push(`enabled = $${paramCount++}`);
    values.push(data.enabled);
  }
  if (data.emailEnabled !== undefined) {
    updates.push(`email_enabled = $${paramCount++}`);
    values.push(data.emailEnabled);
  }
  if (data.emailAddresses !== undefined) {
    updates.push(`email_addresses = $${paramCount++}`);
    values.push(data.emailAddresses);
  }
  if (data.webhookEnabled !== undefined) {
    updates.push(`webhook_enabled = $${paramCount++}`);
    values.push(data.webhookEnabled);
  }
  if (data.webhookUrl !== undefined) {
    updates.push(`webhook_url = $${paramCount++}`);
    values.push(data.webhookUrl);
  }
  if (data.webhookType !== undefined) {
    updates.push(`webhook_type = $${paramCount++}`);
    values.push(data.webhookType);
  }
  if (data.webhookConfig !== undefined) {
    updates.push(`webhook_config = $${paramCount++}`);
    values.push(JSON.stringify(data.webhookConfig));
  }
  if (data.notificationFrequency !== undefined) {
    updates.push(`notification_frequency = $${paramCount++}`);
    values.push(data.notificationFrequency);
  }

  if (updates.length === 0) {
    return getAlertById(alertId, userId);
  }

  const query = `
    UPDATE alerts
    SET ${updates.join(', ')}
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  values.push(alertId, userId);
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapAlertFromDb(result.rows[0]) : null;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string, userId: string): Promise<boolean> {
  const query = `
    DELETE FROM alerts
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [alertId, userId]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get enabled alerts for processing
 */
export async function getEnabledAlerts(projectId?: string): Promise<Alert[]> {
  let query = `
    SELECT * FROM alerts
    WHERE enabled = true
  `;
  const values: any[] = [];

  if (projectId) {
    query += ' AND project_id = $1';
    values.push(projectId);
  }

  const result = await pool.query(query, values);
  return result.rows.map(mapAlertFromDb);
}

/**
 * Record alert trigger in history
 */
export async function createAlertHistory(data: {
  alertId: string;
  keywordId?: string;
  rankingId?: string;
  alertType: AlertType;
  triggerData: Record<string, any>;
}): Promise<AlertHistory> {
  const query = `
    INSERT INTO alert_history (
      alert_id, keyword_id, ranking_id, alert_type, trigger_data
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.alertId,
    data.keywordId || null,
    data.rankingId || null,
    data.alertType,
    JSON.stringify(data.triggerData),
  ];

  const result = await pool.query(query, values);
  return mapAlertHistoryFromDb(result.rows[0]);
}

/**
 * Update alert's last triggered timestamp
 */
export async function updateAlertLastTriggered(alertId: string): Promise<void> {
  const query = `
    UPDATE alerts
    SET last_triggered_at = NOW()
    WHERE id = $1
  `;

  await pool.query(query, [alertId]);
}

/**
 * Mark notification as sent in alert history
 */
export async function markNotificationSent(
  historyId: string,
  type: 'email' | 'webhook',
  responseCode?: number
): Promise<void> {
  const query =
    type === 'email'
      ? `UPDATE alert_history SET email_sent = true, email_sent_at = NOW() WHERE id = $1`
      : `UPDATE alert_history SET webhook_sent = true, webhook_sent_at = NOW(), webhook_response_code = $2 WHERE id = $1`;

  const values = type === 'webhook' ? [historyId, responseCode || null] : [historyId];
  await pool.query(query, values);
}

/**
 * Record notification error
 */
export async function recordNotificationError(
  historyId: string,
  error: { type: string; message: string; timestamp: Date }
): Promise<void> {
  const query = `
    UPDATE alert_history
    SET notification_errors = notification_errors || $2::jsonb
    WHERE id = $1
  `;

  await pool.query(query, [historyId, JSON.stringify([error])]);
}

/**
 * Get alert history for a user or project
 */
export async function getAlertHistory(
  userId: string,
  projectId?: string,
  limit: number = 50
): Promise<AlertHistory[]> {
  let query = `
    SELECT ah.* FROM alert_history ah
    INNER JOIN alerts a ON ah.alert_id = a.id
    WHERE a.user_id = $1
  `;
  const values: any[] = [userId];
  let paramCount = 2;

  if (projectId) {
    query += ` AND a.project_id = $${paramCount++}`;
    values.push(projectId);
  }

  query += ` ORDER BY ah.triggered_at DESC LIMIT $${paramCount}`;
  values.push(limit);

  const result = await pool.query(query, values);
  return result.rows.map(mapAlertHistoryFromDb);
}

/**
 * Get or create notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  let query = `
    SELECT * FROM notification_preferences
    WHERE user_id = $1
  `;

  let result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    // Create default preferences
    query = `
      INSERT INTO notification_preferences (user_id)
      VALUES ($1)
      RETURNING *
    `;
    result = await pool.query(query, [userId]);
  }

  return mapNotificationPreferencesFromDb(result.rows[0]);
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  data: Partial<Omit<NotificationPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<NotificationPreferences> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert camelCase to snake_case
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updates.push(`${dbKey} = $${paramCount++}`);
      values.push(value);
    }
  });

  if (updates.length === 0) {
    return getNotificationPreferences(userId);
  }

  const query = `
    UPDATE notification_preferences
    SET ${updates.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING *
  `;

  values.push(userId);
  const result = await pool.query(query, values);
  return mapNotificationPreferencesFromDb(result.rows[0]);
}

/**
 * Check if alert exists and belongs to user
 */
export async function alertExists(alertId: string, userId: string): Promise<boolean> {
  const query = `
    SELECT 1 FROM alerts
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [alertId, userId]);
  return result.rows.length > 0;
}

// Mapping functions
function mapAlertFromDb(row: any): Alert {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    alertType: row.alert_type,
    conditions: row.conditions,
    keywordFilters: row.keyword_filters,
    enabled: row.enabled,
    emailEnabled: row.email_enabled,
    emailAddresses: row.email_addresses,
    webhookEnabled: row.webhook_enabled,
    webhookUrl: row.webhook_url,
    webhookType: row.webhook_type,
    webhookConfig: row.webhook_config,
    notificationFrequency: row.notification_frequency,
    lastTriggeredAt: row.last_triggered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAlertHistoryFromDb(row: any): AlertHistory {
  return {
    id: row.id,
    alertId: row.alert_id,
    keywordId: row.keyword_id,
    rankingId: row.ranking_id,
    alertType: row.alert_type,
    triggerData: row.trigger_data,
    emailSent: row.email_sent,
    emailSentAt: row.email_sent_at,
    webhookSent: row.webhook_sent,
    webhookSentAt: row.webhook_sent_at,
    webhookResponseCode: row.webhook_response_code,
    notificationErrors: row.notification_errors || [],
    triggeredAt: row.triggered_at,
    createdAt: row.created_at,
  };
}

function mapNotificationPreferencesFromDb(row: any): NotificationPreferences {
  return {
    userId: row.user_id,
    emailNotificationsEnabled: row.email_notifications_enabled,
    webhookNotificationsEnabled: row.webhook_notifications_enabled,
    defaultEmailAddresses: row.default_email_addresses,
    emailFromName: row.email_from_name,
    dailyDigestEnabled: row.daily_digest_enabled,
    dailyDigestTime: row.daily_digest_time,
    weeklyDigestEnabled: row.weekly_digest_enabled,
    weeklyDigestDay: row.weekly_digest_day,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    quietHoursTimezone: row.quiet_hours_timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
