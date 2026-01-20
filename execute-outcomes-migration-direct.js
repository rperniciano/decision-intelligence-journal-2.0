import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🔄 Attempting to create outcomes table...');

  // Read the migration SQL
  const migrationSQL = `
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

  try {
    // Try using RPC to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ RPC method failed:', error.message);

      // Try alternative approach using direct SQL via postgres_meta
      console.log('🔄 Trying alternative approach...');

      // First, try to create the table using a direct query
      const { data: tableData, error: tableError } = await supabase
        .from('outcomes')
        .select('*')
        .limit(1);

      if (tableError && tableError.message.includes('does not exist')) {
        console.log('✓ Confirmed: outcomes table does not exist');
        console.log('❌ Cannot execute DDL via REST API');
        console.log('\n📋 MANUAL ACTION REQUIRED:');
        console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
        console.log('2. Copy the SQL from: apps/api/migrations/create_outcomes_table.sql');
        console.log('3. Paste into SQL Editor');
        console.log('4. Click "Run"');
        return false;
      } else if (!tableError) {
        console.log('✅ Outcomes table already exists!');
        return true;
      }
    } else {
      console.log('✅ Migration executed successfully!');
      return true;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }

  return false;
}

executeMigration().then(success => {
  if (success) {
    console.log('\n✅ Feature #77 ready to test!');
    process.exit(0);
  } else {
    console.log('\n❌ Feature #77 blocked by missing database table');
    process.exit(1);
  }
});
