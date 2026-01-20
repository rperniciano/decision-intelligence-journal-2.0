// ============================================================================
// Feature #135 - Session 5: Execute Migration via Supabase Management API
// ============================================================================
// Attempts to execute the database migration using Supabase Management API v1
//
// The Management API has a /sql endpoint that can execute SQL statements.
// We'll use the SUPABASE_SERVICE_ROLE_KEY which has administrative privileges.
//
// Reference: https://supabase.com/docs/reference/api
// ============================================================================

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
// URL format: https://doqojfsldvajmlscpwhu.supabase.co
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;

async function executeMigration() {
  console.log('================================================================================');
  console.log('Feature #135 - Session 5: Migration via Management API');
  console.log('================================================================================\n');

  console.log('📋 Configuration:');
  console.log('   Project Ref:', projectRef);
  console.log('   API URL:', managementApiUrl);
  console.log();

  // Read the migration SQL
  const migrationPath = path.join(__dirname, 'apps/api/migrations/fix-reminders-table-f101.sql');
  console.log('📄 Reading migration file:', migrationPath);

  let migrationSQL;
  try {
    migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');
    console.log('   Size:', migrationSQL.length, 'bytes');
    console.log();
  } catch (err) {
    console.error('❌ Failed to read migration file:', err.message);
    process.exit(1);
  }

  // Clean up SQL - remove comments and empty lines for cleaner API request
  const statements = migrationSQL
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--');
    })
    .join('\n');

  console.log('🚀 Executing migration via Management API...');
  console.log('-------------------------------------------');

  try {
    const response = await fetch(managementApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: statements
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log();

    const responseText = await response.text();
    console.log('Response Body:', responseText || '(empty)');
    console.log();

    if (response.ok) {
      console.log('================================================================================');
      console.log('✅ MIGRATION EXECUTED SUCCESSFULLY!');
      console.log('================================================================================\n');
      console.log('The database schema has been updated.');
      console.log('Required columns added:');
      console.log('  - remind_at TIMESTAMPTZ');
      console.log('  - user_id UUID REFERENCES profiles(id)');
      console.log('  - idx_reminders_remind_at (index)');
      console.log('  - idx_reminders_user_id (index)');
      console.log('\nNEXT STEPS:');
      console.log('1. Run: node check-f135-schema-session5.js');
      console.log('2. Verify columns exist');
      console.log('3. Test Feature #135 via browser automation');
    } else {
      console.log('================================================================================');
      console.log('❌ MIGRATION FAILED');
      console.log('================================================================================\n');
      console.log('Status:', response.status, response.statusText);
      console.log('Response:', responseText);

      if (response.status === 401) {
        console.log('\n⚠️  Authentication failed');
        console.log('The SUPABASE_SERVICE_ROLE_KEY may not have Management API access.');
        console.log('\nAlternative approaches:');
        console.log('1. Use SUPABASE_ACCESS_TOKEN (personal access token)');
        console.log('2. Execute manually in Supabase Dashboard SQL Editor');
      } else if (response.status === 403) {
        console.log('\n⚠️  Authorization failed');
        console.log('The service role key may not have permission to execute SQL.');
      } else if (response.status === 404) {
        console.log('\n⚠️  Endpoint not found');
        console.log('The Management API /sql endpoint may not be available.');
        console.log('This endpoint might be deprecated or require a different URL.');
      }
    }

  } catch (err) {
    console.error('\n❌ Request failed:', err.message);
    console.error('\nThis could mean:');
    console.error('1. Network connectivity issue');
    console.error('2. Management API endpoint is not accessible');
    console.error('3. Invalid API URL format');
    console.error('\nTry manual execution in Supabase Dashboard instead.');
  }

  console.log('\n================================================================================\n');
}

executeMigration().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
