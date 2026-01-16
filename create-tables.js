// Simple script to create database tables
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('Creating decisions table...');

  // First, check if table exists by trying to query it
  const { error: checkError } = await supabase
    .from('decisions')
    .select('id')
    .limit(1);

  if (!checkError || checkError.code !== 'PGRST204') {
    console.log('✓ Table already exists or accessible');
    return;
  }

  console.log('Table does not exist. Please run the following SQL in Supabase SQL Editor:');
  console.log('\n--- Copy everything below this line ---\n');
  console.log(`
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
  `);
  console.log('\n--- End of SQL ---\n');
}

createTables().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
