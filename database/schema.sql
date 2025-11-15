-- ============================================
-- SEO Keyword Tool Database Schema
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "timescaledb"; -- Commented out for regular PostgreSQL

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- API Keys Table
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_encrypted TEXT NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validated_successfully BOOLEAN DEFAULT false
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_domain ON projects(domain);

-- ============================================
-- Keywords Table
-- ============================================
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
  cpc DECIMAL(10, 2),
  intent VARCHAR(50), -- informational, commercial, transactional, navigational
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, keyword)
);

CREATE INDEX idx_keywords_project_id ON keywords(project_id);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_keywords_difficulty ON keywords(difficulty);
CREATE INDEX idx_keywords_search_volume ON keywords(search_volume);

-- ============================================
-- Rankings Table (Time-series)
-- ============================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  rank INTEGER NOT NULL CHECK (rank > 0),
  url TEXT,
  search_engine VARCHAR(50) NOT NULL, -- google, bing, youtube
  device VARCHAR(50) NOT NULL, -- desktop, mobile
  location VARCHAR(255),
  serp_features TEXT[], -- JSON array of detected SERP features
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (keyword_id, search_engine, device, location, checked_at)
);

-- Convert to hypertable for time-series optimization (TimescaleDB only)
-- SELECT create_hypertable('rankings', 'checked_at', if_not_exists => TRUE);

-- Add compression for time-series data (TimescaleDB only)
-- ALTER TABLE rankings SET (
--   timescaledb.compress,
--   timescaledb.compress_orderby = 'checked_at DESC'
-- );

CREATE INDEX idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX idx_rankings_domain ON rankings(domain);
CREATE INDEX idx_rankings_search_engine ON rankings(search_engine);
CREATE INDEX idx_rankings_device ON rankings(device);

-- ============================================
-- Competitors Table
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, domain)
);

CREATE INDEX idx_competitors_project_id ON competitors(project_id);
CREATE INDEX idx_competitors_domain ON competitors(domain);

-- ============================================
-- Keyword Lists Table
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_keyword_lists_project_id ON keyword_lists(project_id);

-- ============================================
-- Keyword List Items (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_list_id UUID NOT NULL REFERENCES keyword_lists(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(keyword_list_id, keyword_id)
);

CREATE INDEX idx_keyword_list_items_keyword_list_id ON keyword_list_items(keyword_list_id);
CREATE INDEX idx_keyword_list_items_keyword_id ON keyword_list_items(keyword_id);

-- ============================================
-- Rank Tracking History (for tracking changes)
-- ============================================
CREATE TABLE IF NOT EXISTS rank_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  previous_rank INTEGER,
  new_rank INTEGER,
  search_engine VARCHAR(50) NOT NULL,
  device VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  change_magnitude INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN previous_rank IS NULL THEN 0
      WHEN new_rank > previous_rank THEN new_rank - previous_rank
      ELSE previous_rank - new_rank
    END
  ) STORED,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rank_changes_keyword_id ON rank_changes(keyword_id);
CREATE INDEX idx_rank_changes_detected_at ON rank_changes(detected_at);

-- ============================================
-- Create Updated At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER projects_update_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER keywords_update_timestamp
BEFORE UPDATE ON keywords
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER competitors_update_timestamp
BEFORE UPDATE ON competitors
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER keyword_lists_update_timestamp
BEFORE UPDATE ON keyword_lists
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
-- Migration: Add keyword list management
-- This allows users to save and organize discovered keywords into lists

-- Create keyword_lists table
CREATE TABLE IF NOT EXISTS keyword_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create keyword_list_items table
CREATE TABLE IF NOT EXISTS keyword_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES keyword_lists(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  search_volume INTEGER DEFAULT 0,
  cpc DECIMAL(10, 2) DEFAULT 0,
  competition DECIMAL(5, 2) DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  intent VARCHAR(50), -- informational, commercial, transactional, navigational
  is_question BOOLEAN DEFAULT FALSE,
  question_type VARCHAR(50), -- what, how, why, when, where, who, which, other
  opportunity_score INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 1,
  trends JSONB, -- Array of trend values
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_keyword_lists_user_id ON keyword_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_lists_project_id ON keyword_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_lists_created_at ON keyword_lists(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_keyword_list_items_list_id ON keyword_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_keyword_list_items_keyword ON keyword_list_items(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_list_items_search_volume ON keyword_list_items(search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_list_items_difficulty ON keyword_list_items(difficulty);
CREATE INDEX IF NOT EXISTS idx_keyword_list_items_opportunity_score ON keyword_list_items(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_list_items_intent ON keyword_list_items(intent);
CREATE INDEX IF NOT EXISTS idx_keyword_list_items_is_question ON keyword_list_items(is_question);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_keyword_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_keyword_list_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_keyword_lists_updated_at
  BEFORE UPDATE ON keyword_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_list_updated_at();

CREATE TRIGGER trigger_keyword_list_items_updated_at
  BEFORE UPDATE ON keyword_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_list_item_updated_at();

-- Add comments for documentation
COMMENT ON TABLE keyword_lists IS 'Stores keyword lists created by users for organizing discovered keywords';
COMMENT ON TABLE keyword_list_items IS 'Stores individual keywords within keyword lists with enriched metadata';

COMMENT ON COLUMN keyword_lists.project_id IS 'Optional association with a project';
COMMENT ON COLUMN keyword_list_items.intent IS 'Search intent classification';
COMMENT ON COLUMN keyword_list_items.opportunity_score IS 'Calculated opportunity score (0-100)';
COMMENT ON COLUMN keyword_list_items.trends IS 'JSON array of search volume trends over time';
-- Migration: Alerts and Notifications System
-- Creates tables for alert configurations and notification history

-- Alert configurations table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Alert identification
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Alert type and conditions
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('rank_change', 'rank_improvement', 'rank_drop', 'serp_feature', 'competitor_movement', 'new_ranking', 'lost_ranking')),

  -- Threshold configuration (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- Rank change: {"min_position_change": 3, "direction": "down"}
  -- Rank improvement: {"min_position_change": 3, "direction": "up"}
  -- SERP feature: {"feature_types": ["featured_snippet", "people_also_ask"]}
  -- Competitor movement: {"competitor_domains": ["example.com"], "min_change": 5}
  -- New ranking: {"max_position": 20}
  -- Lost ranking: {"was_in_top": 20}

  -- Filters (which keywords/domains trigger this alert)
  keyword_filters JSONB DEFAULT '{}',
  -- Examples: {"keyword_ids": [], "tags": [], "min_search_volume": 1000}

  -- Notification channels
  enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  email_addresses TEXT[], -- Array of email recipients
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT,
  webhook_type VARCHAR(50) CHECK (webhook_type IN ('slack', 'discord', 'custom', NULL)),
  webhook_config JSONB DEFAULT '{}', -- Additional webhook configuration

  -- Frequency control
  notification_frequency VARCHAR(50) NOT NULL DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily_digest', 'weekly_digest')),
  last_triggered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert history table (tracks all triggered alerts)
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,

  -- What triggered this alert
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  ranking_id UUID REFERENCES rankings(id) ON DELETE SET NULL,

  -- Alert details
  alert_type VARCHAR(50) NOT NULL,
  trigger_data JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- {"old_position": 5, "new_position": 12, "change": 7}
  -- {"serp_feature": "featured_snippet", "url": "..."}
  -- {"competitor": "example.com", "their_position": 3}

  -- Notification status
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  webhook_sent BOOLEAN NOT NULL DEFAULT false,
  webhook_sent_at TIMESTAMPTZ,
  webhook_response_code INTEGER,

  -- Notification errors
  notification_errors JSONB DEFAULT '[]',

  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification preferences (per-user general settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Global notification settings
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  webhook_notifications_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Email settings
  default_email_addresses TEXT[],
  email_from_name VARCHAR(255) DEFAULT 'SEO Keyword Tool',

  -- Digest settings
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  daily_digest_time TIME DEFAULT '09:00:00',
  weekly_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  weekly_digest_day INTEGER DEFAULT 1 CHECK (weekly_digest_day BETWEEN 0 AND 6), -- 0=Sunday

  -- Quiet hours (don't send immediate alerts during these times)
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_keyword_id ON alert_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_email_sent ON alert_history(email_sent);
CREATE INDEX IF NOT EXISTS idx_alert_history_webhook_sent ON alert_history(webhook_sent);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_alerts_updated_at_trigger
BEFORE UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION update_alerts_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at_trigger
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_alerts_updated_at();
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
