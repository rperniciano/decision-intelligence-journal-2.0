// Script to apply abandon columns migration via Supabase REST API
// Using RPC (Remote Procedure Call) to execute SQL

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('Applying abandon columns migration...\n');

  try {
    // Check if columns already exist
    console.log('Step 1: Checking if columns already exist...');
    const { data: existingData, error: checkError } = await supabase
      .from('decisions')
      .select('id, abandon_reason, abandon_note')
      .limit(1);

    if (!checkError) {
      console.log('✅ Columns already exist! No migration needed.\n');
      process.exit(0);
    }

    console.log('⚠️  Columns do not exist, need to add them...\n');

    // Since we can't execute DDL via REST API, we'll use Supabase SQL Editor
    console.log('⚠️  Cannot apply DDL via REST API.');
    console.log('\nYou need to manually run this SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
    console.log('--- COPY THIS SQL ---');
    console.log(`
-- Add abandon_reason column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

-- Add abandon_note column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comments
COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions (e.g., "too_complex", "no_longer_relevant", "outside_influence")';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';
    `);
    console.log('--- END SQL ---\n');

    process.exit(1);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
