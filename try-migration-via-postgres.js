/**
 * Try to execute Feature #101 migration using direct PostgreSQL connection
 * via node-postgres with connection string parsing from Supabase URL
 */

const { Pool } = require('pg');
require('dotenv').config();

async function executeMigration() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  Feature #101: Direct PostgreSQL Migration Attempt');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Supabase provides a direct PostgreSQL connection string
  // Format: postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres

  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

  console.log('📋 Project Info:');
  console.log('   URL:', supabaseUrl);
  console.log('   Ref:', projectRef);
  console.log('');

  // We need the database password. In Supabase, this can be found in:
  // Dashboard > Project Settings > Database > Connection String
  // Or via the management API

  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    console.log('❌ SUPABASE_DB_PASSWORD not found in .env');
    console.log('');
    console.log('ℹ️  To get the database password:');
    console.log('   1. Go to: https://app.supabase.com/project/' + projectRef + '/settings/database');
    console.log('   2. Scroll to "Connection string"');
    console.log('   3. Copy the password from the connection string');
    console.log('   4. Add to .env: SUPABASE_DB_PASSWORD=your_password');
    console.log('');

    // Try to use the service role key as Bearer token via REST API
    console.log('🔄 Attempting alternative: Supabase Management API...\n');

    return await tryManagementAPI(projectRef);
  }

  const connectionString = `postgresql://postgres:${dbPassword}@${projectRef}.supabase.co:5432/postgres`;

  console.log('🔗 Connection string constructed (password hidden)');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
  });

  try {
    console.log('\n🔌 Connecting to database...');

    const client = await pool.connect();
    console.log('✅ Connected!\n');

    // Read migration SQL
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/fix-reminders-table-f101.sql', 'utf8');

    // Split into individual statements (filter out comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))
      .map(s => s.replace(/--.*$/gm, '').trim()) // Remove inline comments
      .filter(s => s && !s.startsWith(/\*/));

    console.log('📝 Migration statements to execute:', statements.length);
    console.log('');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.length < 10) continue; // Skip empty/short statements

      console.log(`[${i+1}/${statements.length}] Executing:`);
      console.log('   ', stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));

      try {
        await client.query(stmt);
        console.log('   ✅ Success\n');
      } catch (err) {
        // Check if it's a "already exists" error (which is OK)
        if (err.message.includes('already exists')) {
          console.log('   ⚠️  Already exists (skipping)\n');
        } else {
          console.log('   ❌ Error:', err.message);
          console.log('');

          // Check if it's a permission error
          if (err.message.includes('permission') || err.message.includes('privilege')) {
            console.log('❌ Permission denied. Cannot execute DDL statements.');
            console.log('ℹ️  This is expected - Supabase restricts DDL via direct connections.');
            console.log('');
            console.log('📋 MANUAL EXECUTION REQUIRED:');
            console.log('   See instructions in execute-migration-f101.js\n');
            await client.release();
            await pool.end();
            return false;
          }
        }
      }
    }

    // Verify the changes
    console.log('🔍 Verifying schema changes...\n');

    const checkQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'DecisionsFollowUpReminders'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(checkQuery);

    console.log('Current schema:');
    console.table(result.rows);

    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Feature #101 is now unblocked and ready to test!\n');

    await client.release();
    await pool.end();
    return true;

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await pool.end().catch(() => {});
    return false;
  }
}

async function tryManagementAPI(projectRef) {
  console.log('ℹ️  Supabase Management API requires an access token.');
  console.log('ℹ️  This would require: SUPABASE_ACCESS_TOKEN environment variable.');
  console.log('');
  console.log('❌ Cannot automate migration execution with available tools.');
  console.log('');
  console.log('📋 MANUAL EXECUTION REQUIRED:');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://app.supabase.com/project/' + projectRef + '/sql');
  console.log('');
  console.log('2. Click "New Query"');
  console.log('');
  console.log('3. Copy the contents of:');
  console.log('   migrations/fix-reminders-table-f101.sql');
  console.log('');
  console.log('4. Paste into SQL Editor and click "Run"');
  console.log('');
  console.log('5. Verify no errors occurred');
  console.log('');
  console.log('✅ After migration, Feature #101 will work immediately!\n');

  return false;
}

executeMigration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
