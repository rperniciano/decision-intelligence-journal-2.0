// Add outcome_satisfaction column to decisions table for Feature #91 fallback
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc'
);

async function addColumn() {
  console.log('Adding outcome_satisfaction column to decisions table...');

  // Note: We can't execute DDL through the JS client
  // This would need to be done via SQL in Supabase dashboard
  console.log('SQL to execute in Supabase dashboard:');
  console.log('ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS outcome_satisfaction SMALLINT CHECK (outcome_satisfaction >= 1 AND outcome_satisfaction <= 5);');

  console.log('\nAlternatively, execute the full outcomes table migration:');
  console.log('File: apps/api/migrations/create_outcomes_table.sql');
  console.log('URL: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
}

addColumn().catch(console.error);
