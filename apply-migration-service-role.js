// Try applying migration through Supabase client with service role key
// This uses RPC (remote procedure call) to execute SQL

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.log('⚠️  Cannot apply migration without database credentials.');
  console.log('\nPlease manually run this SQL in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
  console.log(`
-- Add abandon_reason column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

-- Add abandon_note column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comments
COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
  `);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAndApplyMigration() {
  console.log('Checking database schema...\n');

  try {
    // Check if columns exist
    const { data: columns, error } = await supabase
      .rpc('get_columns', { table_name: 'decisions' })
      .select('column_name')
      .in('column_name', ['abandon_reason', 'abandon_note']);

    // If RPC doesn't work, try direct query
    if (error) {
      console.log('RPC not available, trying direct column check...');

      const { data, error: selectError } = await supabase
        .from('decisions')
        .select('id, abandon_reason, abandon_note')
        .limit(1);

      if (!selectError) {
        console.log('✅ Columns already exist!\n');
        process.exit(0);
      }

      if (selectError.message.includes('does not exist')) {
        console.log('❌ Columns do not exist.');
        console.log('\n⚠️  Cannot apply DDL through Supabase REST API.');
        console.log('\nYou need to manually run this SQL in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
        console.log('--- COPY THIS SQL ---');
        console.log(`
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
        `);
        console.log('--- END SQL ---\n');
        process.exit(1);
      }

      throw selectError;
    }

    if (columns && columns.length === 2) {
      console.log('✅ Columns already exist!\n');
      process.exit(0);
    } else {
      console.log('❌ Columns missing. Cannot auto-apply DDL via REST API.');
      console.log('\nPlease run the SQL manually in Supabase SQL Editor.\n');
      process.exit(1);
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAndApplyMigration();
