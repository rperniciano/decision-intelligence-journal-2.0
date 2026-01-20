// Try to execute SQL through Supabase postgres connection
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

async function tryExecuteSQL() {
  console.log('Attempting to add outcome_satisfaction column...');

  // Try using rpc to execute SQL
  try {
    const { data, error } = await supabase.rpc('exec', { sql: 'SELECT 1' });
    console.log('RPC result:', data, error);
  } catch (e) {
    console.log('RPC not available:', e.message);
  }

  // Try direct query to information_schema to check if column exists
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'decisions')
    .eq('column_name', 'outcome_satisfaction');

  console.log('Column check:', data, error);

  if (data && data.length > 0) {
    console.log('Column outcome_satisfaction already exists!');
  } else {
    console.log('\n========================================');
    console.log('MANUAL SQL REQUIRED');
    console.log('========================================');
    console.log('The outcome_satisfaction column does not exist.');
    console.log('\nPlease execute this SQL in Supabase dashboard:');
    console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
    console.log('ALTER TABLE public.decisions');
    console.log('ADD COLUMN IF NOT EXISTS outcome_satisfaction SMALLINT');
    console.log('CHECK (outcome_satisfaction >= 1 AND outcome_satisfaction <= 5);');
    console.log('========================================\n');
  }
}

tryExecuteSQL().catch(console.error);
