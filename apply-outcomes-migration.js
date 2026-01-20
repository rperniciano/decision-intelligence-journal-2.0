// Apply outcomes table migration for Feature #91
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc'
);

async function applyMigration() {
  console.log('Applying outcomes table migration for Feature #91...\n');

  // SQL to execute
  const sql = `
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

    CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON public.outcomes(decision_id);
    CREATE INDEX IF NOT EXISTS idx_outcomes_check_in ON public.outcomes(decision_id, check_in_number);

    ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "Users can view outcomes for own decisions"
      ON public.outcomes
      FOR SELECT
      USING (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY IF NOT EXISTS "Users can insert outcomes for own decisions"
      ON public.outcomes
      FOR INSERT
      WITH CHECK (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY IF NOT EXISTS "Users can update outcomes for own decisions"
      ON public.outcomes
      FOR UPDATE
      USING (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY IF NOT EXISTS "Users can delete outcomes for own decisions"
      ON public.outcomes
      FOR DELETE
      USING (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );
  `;

  // Note: Supabase JS client doesn't support executing raw DDL SQL directly
  // We need to use RPC (Remote Procedure Call) or execute via the SQL editor
  console.log('⚠️  Supabase JS client cannot execute DDL SQL directly.');
  console.log('⚠️  Migration must be applied manually via Supabase SQL Editor.');
  console.log('\n📋 SQL to execute in Supabase SQL Editor:');
  console.log('=======================================');
  console.log(sql);
  console.log('=======================================');
  console.log('\nOr use the Supabase CLI:');
  console.log('supabase db push --db-url postgresql://...');
}

applyMigration().catch(console.error);
