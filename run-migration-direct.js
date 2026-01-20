import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Creating outcomes table for Feature #77...\n');

  try {
    // First, check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === 'PGRST204') {
      console.log('Table does not exist, creating...');

      // Use Supabase Management API to execute SQL
      // We'll use a different approach - create table via INSERT with upsert
    } else if (checkError) {
      console.log('Error checking table:', checkError.message);
    } else {
      console.log('✅ Outcomes table already exists!');
      return;
    }

    // Direct SQL execution via Supabase SQL editor URL approach
    console.log('\nPlease run the following SQL in Supabase SQL Editor:');
    console.log('URL: ' + process.env.SUPABASE_URL.replace('/rest/v1', '/project/sql') + '\n');
    console.log('---SQL BELOW---');

    const sql = `
-- Create outcomes table for multiple check-ins per decision (Feature #77)
CREATE TABLE IF NOT EXISTS public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  result VARCHAR(20) NOT NULL CHECK (result IN ('better', 'as_expected', 'worse')),
  satisfaction SMALLINT CHECK (satisfaction >= 1 AND satisfaction <= 5),
  reflection_audio_url TEXT,
  reflection_transcript TEXT,
  learned TEXT,
  scheduled_for DATE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_number SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON public.outcomes(decision_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_check_in ON public.outcomes(decision_id, check_in_number);

-- Enable RLS
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view outcomes for own decisions"
  ON public.outcomes
  FOR SELECT
  USING (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert outcomes for own decisions"
  ON public.outcomes
  FOR INSERT
  WITH CHECK (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outcomes for own decisions"
  ON public.outcomes
  FOR UPDATE
  USING (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outcomes for own decisions"
  ON public.outcomes
  FOR DELETE
  USING (
    decision_id IN (
      SELECT id FROM public.decisions WHERE user_id = auth.uid()
    )
  );
`;

    console.log(sql);
    console.log('---END SQL---\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration().catch(console.error);
