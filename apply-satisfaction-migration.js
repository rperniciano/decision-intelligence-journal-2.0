const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Applying migration: Add outcome_satisfaction column...');

  // Execute the ALTER TABLE statement via RPC
  // Note: This requires a Supabase admin function or direct SQL execution
  // For now, let's try using direct SQL through the client

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS outcome_satisfaction INTEGER NULL
        CHECK (outcome_satisfaction IS NULL OR (outcome_satisfaction >= 1 AND outcome_satisfaction <= 5));

        CREATE INDEX IF NOT EXISTS idx_decisions_outcome_satisfaction
        ON decisions(outcome_satisfaction)
        WHERE outcome_satisfaction IS NOT NULL;
      `
    });

    if (error) {
      console.error('Error applying migration:', error);
      console.log('\nThe migration SQL needs to be applied manually in Supabase SQL Editor:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Navigate to your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Run the SQL from migration-add-outcome-satisfaction.sql');
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

applyMigration();
