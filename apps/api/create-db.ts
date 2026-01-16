// Quick database table creation check
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Try to query decisions table
  const { data, error } = await supabase
    .from('decisions')
    .select('id')
    .limit(1);

  if (error) {
    console.log('❌ Decisions table does not exist or has errors.');
    console.log('Error:', error.message);
    console.log('\n📋 Please run this SQL in Supabase SQL Editor:\n');
    console.log(SQL_SCRIPT);
  } else {
    console.log('✅ Decisions table exists and is accessible!');
    console.log(`Found ${data.length} decision(s)`);
  }
}

const SQL_SCRIPT = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT NOT NULL,
  emotional_state TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  transcription TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT decisions_status_check CHECK (status IN ('draft', 'deliberating', 'decided', 'abandoned', 'reviewed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can create own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can update own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can delete own decisions" ON decisions;

-- RLS Policies
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
`;

main();
