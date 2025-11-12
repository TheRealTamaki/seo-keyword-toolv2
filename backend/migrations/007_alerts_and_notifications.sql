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
