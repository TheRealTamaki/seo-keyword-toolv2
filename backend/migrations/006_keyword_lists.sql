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
