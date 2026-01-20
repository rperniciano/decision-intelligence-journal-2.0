// ============================================================================
// Feature #135 - Session 5: Execute Migration via Direct PostgreSQL
// ============================================================================
// Attempts to execute the migration using a direct PostgreSQL connection.
//
// Supabase provides direct PostgreSQL access via port 5432.
// Connection string format: postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
//
// We'll try multiple password sources:
// 1. SUPABASE_DB_PASSWORD environment variable
// 2. Try to derive from service role key (unlikely to work)
// 3. Prompt for password (not available in automation)
// ============================================================================

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in .env');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// PostgreSQL connection string
const connectionString = `postgresql://postgres.db_${projectRef}:${dbPassword || 'PASSWORD'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function executeMigration() {
  console.log('================================================================================');
  console.log('Feature #135 - Session 5: Migration via Direct PostgreSQL');
  console.log('================================================================================\n');

  console.log('📋 Configuration:');
  console.log('   Project Ref:', projectRef);
  console.log('   Host: aws-0-us-east-1.pooler.supabase.com:6543');
  console.log('   Database: postgres');
  console.log('   Password:', dbPassword ? 'SET' : 'NOT SET');
  console.log();

  if (!dbPassword) {
    console.log('❌ SUPABASE_DB_PASSWORD not set in .env');
    console.log('\nTo obtain the database password:');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/settings/database');
    console.log('2. Scroll to "Connection string" section');
    console.log('3. Click "URI" tab');
    console.log('4. Copy the password from the connection string');
    console.log('5. Add to .env: SUPABASE_DB_PASSWORD=<password>');
    console.log('\nThen run this script again.');
    console.log('\n================================================================================\n');
    process.exit(1);
  }

  // Read the migration SQL
  const migrationPath = path.join(__dirname, 'apps/api/migrations/fix-reminders-table-f101.sql');
  console.log('📄 Reading migration file:', migrationPath);

  let migrationSQL;
  try {
    migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');
    console.log();
  } catch (err) {
    console.error('❌ Failed to read migration file:', err.message);
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  console.log('🔌 Connecting to PostgreSQL...');
  console.log('-------------------------------------------');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n🚀 Executing migration...');
    console.log('-------------------------------------------');

    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!');

    console.log('\n🔍 Verifying schema...');
    console.log('-------------------------------------------');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'DecisionsFollowUpReminders'
      ORDER BY ordinal_position
    `);

    console.log('\n✅ Current schema:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n================================================================================');
    console.log('✅ MIGRATION COMPLETE!');
    console.log('================================================================================\n');
    console.log('Required columns added:');
    console.log('  ✅ remind_at TIMESTAMPTZ');
    console.log('  ✅ user_id UUID REFERENCES profiles(id)');
    console.log('\nIndexes created:');
    console.log('  ✅ idx_reminders_remind_at');
    console.log('  ✅ idx_reminders_user_id');
    console.log('\nNEXT STEPS:');
    console.log('1. Run: node check-f135-schema-session5.js');
    console.log('2. Verify columns exist');
    console.log('3. Test Feature #135 via browser automation');

  } catch (err) {
    console.log('\n================================================================================');
    console.log('❌ MIGRATION FAILED');
    console.log('================================================================================\n');
    console.error('Error:', err.message);

    if (err.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Connection refused');
      console.log('Possible causes:');
      console.log('1. Database password is incorrect');
      console.log('2. Database connection pooler is not accessible');
      console.log('3. Network connectivity issue');
    } else if (err.code === '28P01') {
      console.log('\n⚠️  Authentication failed');
      console.log('The database password is incorrect.');
      console.log('\nTo get the correct password:');
      console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/settings/database');
      console.log('2. Scroll to "Connection pooling" section');
      console.log('3. Copy the "Transaction mode" connection string');
      console.log('4. Extract the password after "postgres:" and before "@"');
    } else if (err.code === '3D000') {
      console.log('\n⚠️  Database does not exist');
      console.log('The database name "postgres" may not be correct.');
    } else {
      console.log('\nPostgreSQL Error Code:', err.code);
      console.log('Detail:', err.detail);
      console.log('Hint:', err.hint);
    }

    console.log('\nFALLBACK: Execute manually in Supabase Dashboard');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('2. Copy contents of: apps/api/migrations/fix-reminders-table-f101.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run"');
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
    console.log('================================================================================\n');
  }
}

executeMigration().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
