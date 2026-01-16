-- Decisions Intelligence Journal Database Schema
-- Run this script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'deliberating', 'decided', 'abandoned', 'reviewed')),
  category TEXT NOT NULL,
  emotional_state TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  transcription TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_deleted_at ON decisions(deleted_at) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can create own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can update own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can delete own decisions" ON decisions;

-- RLS Policies: Users can only access their own decisions
CREATE POLICY "Users can view own decisions"
  ON decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own decisions"
  ON decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_decisions_updated_at ON decisions;
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
