import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log('Executing outcomes table migration for Feature #77...\n');

  try {
    // Check if table exists first
    const { data: existingTable, error: checkError } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (!checkError || checkError.code !== 'PGRST204') {
      console.log('✅ Outcomes table already exists! Skipping migration.');
      return;
    }

    console.log('Table does not exist. Creating outcomes table...');

    // Use raw SQL via RPC - we'll need to create a temporary RPC function
    // that executes DDL statements

    const sqlStatements = [
      // Create table
      `CREATE TABLE IF NOT EXISTS public.outcomes (
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
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON public.outcomes(decision_id)`,
      `CREATE INDEX IF NOT EXISTS idx_outcomes_check_in ON public.outcomes(decision_id, check_in_number)`,

      // Enable RLS
      `ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY`,

      // RLS Policies
      `CREATE POLICY "Users can view outcomes for own decisions"
        ON public.outcomes
        FOR SELECT
        USING (
          decision_id IN (
            SELECT id FROM public.decisions WHERE user_id = auth.uid()
          )
        )`,

      `CREATE POLICY "Users can insert outcomes for own decisions"
        ON public.outcomes
        FOR INSERT
        WITH CHECK (
          decision_id IN (
            SELECT id FROM public.decisions WHERE user_id = auth.uid()
          )
        )`,

      `CREATE POLICY "Users can update outcomes for own decisions"
        ON public.outcomes
        FOR UPDATE
        USING (
          decision_id IN (
            SELECT id FROM public.decisions WHERE user_id = auth.uid()
          )
        )`,

      `CREATE POLICY "Users can delete outcomes for own decisions"
        ON public.outcomes
        FOR DELETE
        USING (
          decision_id IN (
            SELECT id FROM public.decisions WHERE user_id = auth.uid()
          )
        )`
    ];

    // Create a temporary RPC function to execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];

      // Create a temporary function that executes the SQL
      const { data: fnData, error: fnError } = await supabase.rpc('exec_sql', {
        sql_statement: sql
      });

      if (fnError && !fnError.message.includes('does not exist')) {
        console.log(`Statement ${i + 1}/${sqlStatements.length}:`, fnError.message);
      } else {
        console.log(`✓ Statement ${i + 1}/${sqlStatements.length} executed`);
      }
    }

    // Verify table was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (verifyError && verifyError.code === 'PGRST204') {
      console.log('\n❌ Table creation failed. Please run SQL manually in Supabase dashboard.');
      console.log('SQL file: apps/api/migrations/create_outcomes_table.sql');
    } else {
      console.log('\n✅ Outcomes table created successfully!');
    }

  } catch (error) {
    console.error('Error executing migration:', error.message);
  }
}

executeMigration().catch(console.error);
