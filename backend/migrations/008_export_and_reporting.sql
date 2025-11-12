-- Migration: Export and Reporting System
-- Creates tables for report templates, schedules, and history

-- Report templates (reusable report configurations)
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Template identification
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Report type
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'ranking_performance',
    'keyword_research',
    'competitor_analysis',
    'project_overview',
    'custom'
  )),

  -- Report configuration (JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- {"date_range": "last_30_days", "include_charts": true, "metrics": ["rankings", "changes"]}
  -- {"keyword_ids": [], "competitor_ids": [], "sections": ["overview", "gaps", "opportunities"]}

  -- Output format
  format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'pdf', 'json')),

  -- White-label branding
  branding JSONB DEFAULT '{}',
  -- Example: {"company_name": "Agency Name", "logo_url": "...", "primary_color": "#123456"}

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report schedules (automated report generation)
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,

  -- Schedule identification
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Schedule configuration
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom_cron')),
  cron_expression VARCHAR(100), -- For custom schedules
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Execution time (for non-cron schedules)
  execution_time TIME, -- e.g., 09:00:00 for 9 AM
  execution_day_of_week INTEGER, -- 0=Sunday, 6=Saturday (for weekly)
  execution_day_of_month INTEGER CHECK (execution_day_of_month BETWEEN 1 AND 31), -- For monthly

  -- Delivery configuration
  delivery_method VARCHAR(50) NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'webhook', 'storage')),
  delivery_config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- Email: {"recipients": ["user@example.com"], "subject": "Weekly Report"}
  -- Webhook: {"url": "https://...", "method": "POST", "headers": {}}
  -- Storage: {"path": "reports/", "filename_pattern": "report_{date}.pdf"}

  -- Status tracking
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status VARCHAR(50), -- 'success', 'failed', 'running'
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report history (track all generated reports)
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Report details
  report_type VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL,
  file_name VARCHAR(500),
  file_size INTEGER, -- bytes
  file_url TEXT, -- Cloud storage URL or local path

  -- Generation details
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generation_time_ms INTEGER, -- How long it took to generate
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,

  -- Report metadata
  report_data JSONB DEFAULT '{}',
  -- Stores summary stats: {"total_keywords": 50, "avg_position": 12.5, "date_range": {...}}

  -- Delivery tracking
  delivered_at TIMESTAMPTZ,
  delivery_status VARCHAR(50) CHECK (delivery_status IN ('pending', 'sent', 'failed', NULL)),
  delivery_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Export jobs (track manual exports)
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Export details
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN (
    'keywords',
    'rankings',
    'competitors',
    'keyword_lists',
    'alert_history',
    'projects'
  )),
  format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'json', 'xlsx')),

  -- Export configuration
  filters JSONB DEFAULT '{}',
  columns JSONB, -- Array of columns to include

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

  -- Output
  file_name VARCHAR(500),
  file_url TEXT,
  file_size INTEGER,
  row_count INTEGER,

  -- Error handling
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_user_id ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_project_id ON report_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_report_type ON report_templates(report_type);

CREATE INDEX IF NOT EXISTS idx_report_schedules_user_id ON report_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_template_id ON report_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_enabled ON report_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at ON report_schedules(next_run_at);

CREATE INDEX IF NOT EXISTS idx_report_history_user_id ON report_history(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_project_id ON report_history(project_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_at ON report_history(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_history_status ON report_history(status);

CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created_at ON export_jobs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_report_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_report_templates_updated_at_trigger
BEFORE UPDATE ON report_templates
FOR EACH ROW
EXECUTE FUNCTION update_report_templates_updated_at();

CREATE TRIGGER update_report_schedules_updated_at_trigger
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_report_schedules_updated_at();

-- Function to calculate next run time for schedules
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_frequency VARCHAR,
  p_execution_time TIME,
  p_execution_day_of_week INTEGER,
  p_execution_day_of_month INTEGER,
  p_timezone VARCHAR
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_next_run TIMESTAMPTZ;
BEGIN
  v_now := NOW() AT TIME ZONE p_timezone;

  CASE p_frequency
    WHEN 'daily' THEN
      v_next_run := (CURRENT_DATE + p_execution_time) AT TIME ZONE p_timezone;
      IF v_next_run <= v_now THEN
        v_next_run := v_next_run + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      v_next_run := (CURRENT_DATE + p_execution_time) AT TIME ZONE p_timezone;
      -- Adjust to target day of week
      v_next_run := v_next_run + ((p_execution_day_of_week - EXTRACT(DOW FROM v_next_run)::INTEGER + 7) % 7) * INTERVAL '1 day';
      IF v_next_run <= v_now THEN
        v_next_run := v_next_run + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      v_next_run := (CURRENT_DATE + p_execution_time) AT TIME ZONE p_timezone;
      -- Adjust to target day of month
      v_next_run := DATE_TRUNC('month', v_next_run) + (p_execution_day_of_month - 1) * INTERVAL '1 day' + p_execution_time;
      IF v_next_run <= v_now THEN
        v_next_run := v_next_run + INTERVAL '1 month';
      END IF;

    ELSE
      -- For custom_cron, caller should handle
      v_next_run := v_now + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;
