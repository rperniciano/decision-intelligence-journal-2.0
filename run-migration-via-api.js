const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const projectRef = 'doqojfsldvajmlscpwhu'; // from SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Read migration SQL
  const sql = fs.readFileSync(
    path.join(__dirname, 'migration-add-outcomes-tables.sql'),
    'utf8'
  );

  console.log('Attempting to run migration via Supabase SQL API...\n');

  try {
    const response = await fetch(
      `https://${projectRef}.supabase.co/rest/v1/rpc/exec`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sql })
      }
    );

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.status === 404) {
      console.log('\n❌ Direct SQL execution not available via API');
      console.log('\n📋 Please run the migration manually:');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/' + projectRef);
      console.log('2. Go to SQL Editor');
      console.log('3. Copy contents of: migration-add-outcomes-tables.sql');
      console.log('4. Paste and click "Run"');
      console.log('5. Verify with: node check-outcomes-tables.js\n');
    } else if (response.ok) {
      console.log('✓ Migration executed successfully!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runMigration();
