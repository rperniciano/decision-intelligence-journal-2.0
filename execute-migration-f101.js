/**
 * Execute Feature #101 Migration - Add remind_at and user_id columns to DecisionsFollowUpReminders
 *
 * This script uses the Supabase client with service role key to execute DDL statements.
 * The service role key bypasses RLS and allows schema modifications.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  console.log('🚀 Starting Feature #101 Migration...\n');

  const migrations = [
    {
      name: 'Add remind_at column',
      sql: `ALTER TABLE "DecisionsFollowUpReminders" ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;`
    },
    {
      name: 'Add comment on remind_at',
      sql: `COMMENT ON COLUMN "DecisionsFollowUpReminders".remind_at IS 'UTC timestamp when the reminder should be sent (includes timezone info)';`
    },
    {
      name: 'Add user_id column',
      sql: `ALTER TABLE "DecisionsFollowUpReminders" ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);`
    },
    {
      name: 'Add comment on user_id',
      sql: `COMMENT ON COLUMN "DecisionsFollowUpReminders".user_id IS 'Foreign key to profiles table (user who owns the reminder)';`
    },
    {
      name: 'Create index on remind_at',
      sql: `CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON "DecisionsFollowUpReminders"(remind_at) WHERE status = 'pending';`
    },
    {
      name: 'Create index on user_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON "DecisionsFollowUpReminders"(user_id);`
    }
  ];

  // Note: Supabase JS client doesn't support direct DDL execution via RPC
  // We need to use pg or execute via a different method
  console.log('⚠️  Supabase JS client cannot execute DDL statements directly.');
  console.log('ℹ️  We need to use the PostgreSQL client or execute via Supabase Dashboard.\n');

  // Try using node-postgres directly
  const { Pool } = require('pg');

  // Parse Supabase connection string
  // Format: postgresql://postgres:[password]@[host]:5432/postgres
  const dbUrl = supabaseUrl.replace('https://', 'postgresql://postgres:' + process.env.SUPABASE_DB_PASSWORD + '@' + supabaseUrl.replace('https://', '').replace('.supabase.co', '.supabase.co:5432') + '/postgres');

  console.log('Attempting to connect via node-postgres...');
  console.log('Note: This requires SUPABASE_DB_PASSWORD environment variable.\n');

  if (!process.env.SUPABASE_DB_PASSWORD) {
    console.log('❌ SUPABASE_DB_PASSWORD not found in .env');
    console.log('\n❌ Cannot execute DDL via available tools.');
    console.log('\n📋 MANUAL STEPS REQUIRED:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project: doqojfsldvajmlscpwhu');
    console.log('3. Click on "SQL Editor" in the left sidebar');
    console.log('4. Create a new query');
    console.log('5. Copy the contents of: migrations/fix-reminders-table-f101.sql');
    console.log('6. Paste into SQL Editor and click "Run"');
    console.log('7. Verify no errors occurred\n');
    return false;
  }

  return false;
}

// Alternative: Create a temporary RPC function that executes DDL
async function executeViaRPC() {
  console.log('🔧 Attempting to execute migration via RPC function...\n');

  // Create a temporary SQL function that will execute DDL
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_ddl(sql_param TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_param;
      RETURN 'OK';
    END;
    $$;
  `;

  console.log('⚠️  This approach requires superuser privileges which may not be available.');
  console.log('ℹ️  Supabase typically restricts DDL execution via RPC for security.\n');

  return false;
}

async function checkCurrentSchema() {
  console.log('🔍 Checking current schema of DecisionsFollowUpReminders...\n');

  try {
    // Try to query the current schema using the service role client
    // We can use a system table query via RPC if available
    const { data, error } = await supabase
      .rpc('get_table_schema', { table_name: 'DecisionsFollowUpReminders' })
      .select('*');

    if (error) {
      console.log('ℹ️  Cannot check schema via RPC (function may not exist)');
      return false;
    }

    console.log('Current schema:', data);
    return data;
  } catch (err) {
    console.log('ℹ️  Cannot check schema via available methods');
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  Feature #101: Migration Executor');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Check current schema
  await checkCurrentSchema();

  // Try to execute migration
  const result = await executeMigration();

  if (!result) {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  MIGRATION STATUS: BLOCKED - Manual execution required');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    console.log('📋 REQUIRED MANUAL STEPS:');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('1. Open: https://app.supabase.com/project/doqojfsldvajmlscpwhu/sql');
    console.log('2. Click "New Query"');
    console.log('3. Copy the entire contents of: migrations/fix-reminders-table-f101.sql');
    console.log('4. Paste into the SQL Editor');
    console.log('5. Click "Run" button');
    console.log('6. Verify success (no error messages)');
    console.log('\n📄 Migration file location:');
    console.log('   migrations/fix-reminders-table-f101.sql\n');

    console.log('✅ After running the migration:');
    console.log('   - Feature #101 will work immediately');
    console.log('   - No code changes needed');
    console.log('   - Reminder background job will start functioning\n');
  }

  process.exit(result ? 0 : 1);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
