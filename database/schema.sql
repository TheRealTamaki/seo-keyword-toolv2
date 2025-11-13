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
