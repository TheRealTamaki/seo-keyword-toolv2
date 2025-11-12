import { pool } from '../config/database';

// Types
export type ReportType = 'ranking_performance' | 'keyword_research' | 'competitor_analysis' | 'project_overview' | 'custom';
export type ReportFormat = 'csv' | 'pdf' | 'json';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'custom_cron';
export type DeliveryMethod = 'email' | 'webhook' | 'storage';

export interface ReportTemplate {
  id: string;
  userId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  reportType: ReportType;
  config: Record<string, any>;
  format: ReportFormat;
  branding: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  frequency: ReportFrequency;
  cronExpression: string | null;
  timezone: string;
  executionTime: string | null;
  executionDayOfWeek: number | null;
  executionDayOfMonth: number | null;
  deliveryMethod: DeliveryMethod;
  deliveryConfig: Record<string, any>;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastRunStatus: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportHistory {
  id: string;
  userId: string;
  templateId: string | null;
  scheduleId: string | null;
  projectId: string;
  reportType: ReportType;
  format: ReportFormat;
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  generatedAt: Date;
  generationTimeMs: number | null;
  status: string;
  errorMessage: string | null;
  reportData: Record<string, any>;
  deliveredAt: Date | null;
  deliveryStatus: string | null;
  deliveryError: string | null;
  createdAt: Date;
}

export interface ExportJob {
  id: string;
  userId: string;
  projectId: string | null;
  exportType: string;
  format: string;
  filters: Record<string, any>;
  columns: string[] | null;
  status: string;
  progress: number;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Report Templates CRUD

export async function createReportTemplate(data: {
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
  reportType: ReportType;
  config: Record<string, any>;
  format: ReportFormat;
  branding?: Record<string, any>;
}): Promise<ReportTemplate> {
  const query = `
    INSERT INTO report_templates (
      user_id, project_id, name, description, report_type, config, format, branding
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    data.userId,
    data.projectId || null,
    data.name,
    data.description || null,
    data.reportType,
    JSON.stringify(data.config),
    data.format,
    JSON.stringify(data.branding || {}),
  ];

  const result = await pool.query(query, values);
  return mapReportTemplateFromDb(result.rows[0]);
}

export async function getReportTemplates(userId: string, projectId?: string): Promise<ReportTemplate[]> {
  let query = 'SELECT * FROM report_templates WHERE user_id = $1';
  const values: any[] = [userId];

  if (projectId) {
    query += ' AND project_id = $2';
    values.push(projectId);
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, values);
  return result.rows.map(mapReportTemplateFromDb);
}

export async function getReportTemplateById(templateId: string, userId: string): Promise<ReportTemplate | null> {
  const query = 'SELECT * FROM report_templates WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [templateId, userId]);
  return result.rows.length > 0 ? mapReportTemplateFromDb(result.rows[0]) : null;
}

export async function updateReportTemplate(
  templateId: string,
  userId: string,
  data: Partial<Omit<ReportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<ReportTemplate | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (typeof value === 'object' && !Array.isArray(value)) {
        updates.push(`${dbKey} = $${paramCount++}`);
        values.push(JSON.stringify(value));
      } else {
        updates.push(`${dbKey} = $${paramCount++}`);
        values.push(value);
      }
    }
  });

  if (updates.length === 0) {
    return getReportTemplateById(templateId, userId);
  }

  const query = `
    UPDATE report_templates
    SET ${updates.join(', ')}
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  values.push(templateId, userId);
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapReportTemplateFromDb(result.rows[0]) : null;
}

export async function deleteReportTemplate(templateId: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM report_templates WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [templateId, userId]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Report Schedules CRUD

export async function createReportSchedule(data: {
  userId: string;
  templateId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  frequency: ReportFrequency;
  cronExpression?: string;
  timezone?: string;
  executionTime?: string;
  executionDayOfWeek?: number;
  executionDayOfMonth?: number;
  deliveryMethod?: DeliveryMethod;
  deliveryConfig: Record<string, any>;
}): Promise<ReportSchedule> {
  // Calculate next run time
  const nextRunAt = await calculateNextRunTime(data);

  const query = `
    INSERT INTO report_schedules (
      user_id, template_id, name, description, enabled, frequency, cron_expression,
      timezone, execution_time, execution_day_of_week, execution_day_of_month,
      delivery_method, delivery_config, next_run_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  const values = [
    data.userId,
    data.templateId,
    data.name,
    data.description || null,
    data.enabled !== undefined ? data.enabled : true,
    data.frequency,
    data.cronExpression || null,
    data.timezone || 'UTC',
    data.executionTime || null,
    data.executionDayOfWeek || null,
    data.executionDayOfMonth || null,
    data.deliveryMethod || 'email',
    JSON.stringify(data.deliveryConfig),
    nextRunAt,
  ];

  const result = await pool.query(query, values);
  return mapReportScheduleFromDb(result.rows[0]);
}

export async function getReportSchedules(userId: string): Promise<ReportSchedule[]> {
  const query = `
    SELECT rs.*, rt.name as template_name
    FROM report_schedules rs
    INNER JOIN report_templates rt ON rs.template_id = rt.id
    WHERE rs.user_id = $1
    ORDER BY rs.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.map(mapReportScheduleFromDb);
}

export async function getReportScheduleById(scheduleId: string, userId: string): Promise<ReportSchedule | null> {
  const query = 'SELECT * FROM report_schedules WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [scheduleId, userId]);
  return result.rows.length > 0 ? mapReportScheduleFromDb(result.rows[0]) : null;
}

export async function updateReportSchedule(
  scheduleId: string,
  userId: string,
  data: Partial<Omit<ReportSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<ReportSchedule | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (typeof value === 'object' && !Array.isArray(value)) {
        updates.push(`${dbKey} = $${paramCount++}`);
        values.push(JSON.stringify(value));
      } else {
        updates.push(`${dbKey} = $${paramCount++}`);
        values.push(value);
      }
    }
  });

  if (updates.length === 0) {
    return getReportScheduleById(scheduleId, userId);
  }

  const query = `
    UPDATE report_schedules
    SET ${updates.join(', ')}
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  values.push(scheduleId, userId);
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapReportScheduleFromDb(result.rows[0]) : null;
}

export async function deleteReportSchedule(scheduleId: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM report_schedules WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [scheduleId, userId]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getDueReportSchedules(): Promise<ReportSchedule[]> {
  const query = `
    SELECT * FROM report_schedules
    WHERE enabled = true
      AND next_run_at <= NOW()
    ORDER BY next_run_at ASC
  `;

  const result = await pool.query(query);
  return result.rows.map(mapReportScheduleFromDb);
}

// Report History

export async function createReportHistory(data: {
  userId: string;
  templateId?: string;
  scheduleId?: string;
  projectId: string;
  reportType: ReportType;
  format: ReportFormat;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  generationTimeMs?: number;
  status?: string;
  errorMessage?: string;
  reportData?: Record<string, any>;
}): Promise<ReportHistory> {
  const query = `
    INSERT INTO report_history (
      user_id, template_id, schedule_id, project_id, report_type, format,
      file_name, file_size, file_url, generation_time_ms, status, error_message, report_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const values = [
    data.userId,
    data.templateId || null,
    data.scheduleId || null,
    data.projectId,
    data.reportType,
    data.format,
    data.fileName || null,
    data.fileSize || null,
    data.fileUrl || null,
    data.generationTimeMs || null,
    data.status || 'pending',
    data.errorMessage || null,
    JSON.stringify(data.reportData || {}),
  ];

  const result = await pool.query(query, values);
  return mapReportHistoryFromDb(result.rows[0]);
}

export async function getReportHistory(
  userId: string,
  projectId?: string,
  limit: number = 50
): Promise<ReportHistory[]> {
  let query = 'SELECT * FROM report_history WHERE user_id = $1';
  const values: any[] = [userId];
  let paramCount = 2;

  if (projectId) {
    query += ` AND project_id = $${paramCount++}`;
    values.push(projectId);
  }

  query += ` ORDER BY generated_at DESC LIMIT $${paramCount}`;
  values.push(limit);

  const result = await pool.query(query, values);
  return result.rows.map(mapReportHistoryFromDb);
}

export async function updateReportHistoryStatus(
  historyId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  const query = `
    UPDATE report_history
    SET status = $2, error_message = $3
    WHERE id = $1
  `;

  await pool.query(query, [historyId, status, errorMessage || null]);
}

// Helper functions

async function calculateNextRunTime(data: any): Promise<Date> {
  // Simple calculation - in production would use cron parser or more sophisticated logic
  const now = new Date();
  let nextRun = new Date(now);

  switch (data.frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
  }

  return nextRun;
}

// Mapping functions
function mapReportTemplateFromDb(row: any): ReportTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    reportType: row.report_type,
    config: row.config,
    format: row.format,
    branding: row.branding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReportScheduleFromDb(row: any): ReportSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    frequency: row.frequency,
    cronExpression: row.cron_expression,
    timezone: row.timezone,
    executionTime: row.execution_time,
    executionDayOfWeek: row.execution_day_of_week,
    executionDayOfMonth: row.execution_day_of_month,
    deliveryMethod: row.delivery_method,
    deliveryConfig: row.delivery_config,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    lastRunStatus: row.last_run_status,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReportHistoryFromDb(row: any): ReportHistory {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    scheduleId: row.schedule_id,
    projectId: row.project_id,
    reportType: row.report_type,
    format: row.format,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileUrl: row.file_url,
    generatedAt: row.generated_at,
    generationTimeMs: row.generation_time_ms,
    status: row.status,
    errorMessage: row.error_message,
    reportData: row.report_data,
    deliveredAt: row.delivered_at,
    deliveryStatus: row.delivery_status,
    deliveryError: row.delivery_error,
    createdAt: row.created_at,
  };
}
