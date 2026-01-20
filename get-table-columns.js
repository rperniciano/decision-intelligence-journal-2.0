// Get actual columns from information_schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableColumns() {
  console.log('=== Getting Actual Table Schema ===\n');

  // Query information_schema to get column information
  const { data, error } = await supabase.rpc('get_table_schema', {
    table_name: 'DecisionsFollowUpReminders'
  });

  if (error) {
    console.log('RPC error:', error.message);

    // Try direct SQL query
    const { data: sqlData, error: sqlError } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(0);

    if (sqlError) {
      console.log('\nDirect query error:', sqlError.message);
      console.log('\nTrying PostgreSQL query via edge function...');

      // Use a raw PostgreSQL query
      const { data: pgData, error: pgError } = await supabase
        .rpc('exec_sql', { sql: `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'DecisionsFollowUpReminders'
          ORDER BY ordinal_position;
        `});

      if (pgError) {
        console.log('PostgreSQL query error:', pgError.message);
        console.log('\n⚠️  Cannot determine actual schema');
        console.log('This requires direct SQL access through Supabase dashboard');
        return;
      }

      console.log('Schema:', pgData);
      return;
    }
  }

  console.log('Schema data:', data);
}

getTableColumns().catch(console.error);
