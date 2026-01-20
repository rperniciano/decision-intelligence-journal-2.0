const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log('Attempting to execute migration for Feature #88...\n');
  console.log('Adding abandon_reason and abandon_note columns to decisions table\n');

  // Try using PostgreSQL through a different approach
  // Supabase doesn't support DDL through REST API, but let's try some alternatives

  try {
    // Method 1: Try to use the SQL endpoint directly
    const sqlEndpoint = `${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`;

    const response = await fetch(sqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        sql: `ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);`
      })
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n⚠️  DDL statements cannot be executed through Supabase REST API');
  console.log('\nTo complete this migration, you must:');
  console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
  console.log('2. Copy the contents of: migration-add-abandonment-columns.sql');
  console.log('3. Paste into SQL Editor');
  console.log('4. Click "Run"');
  console.log('\nThen Feature #88 will work immediately!');
}

executeMigration();
