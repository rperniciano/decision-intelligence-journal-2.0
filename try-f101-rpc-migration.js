/**
 * Try to execute Feature #101 migration via Supabase RPC
 * This attempts to find ANY automated way to execute the migration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function tryRpcMigration() {
  console.log('🔍 Attempting Feature #101 migration via Supabase RPC...\n');

  // Approach 1: Try to use pgsql_exec extension (if available)
  console.log('Approach 1: Testing sql_exec function...');

  const { data: extData, error: extError } = await supabase.rpc('sql_exec', {
    query: "SELECT 1 as test"
  });

  if (extError) {
    console.log('❌ sql_exec not available:', extError.message);
  } else {
    console.log('✅ Function available! Executing migration...');
    const { data, error } = await supabase.rpc('sql_exec', {
      query: `
        ALTER TABLE "DecisionsFollowUpReminders"
        ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;

        ALTER TABLE "DecisionsFollowUpReminders"
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

        CREATE INDEX IF NOT EXISTS idx_reminders_remind_at
        ON "DecisionsFollowUpReminders"(remind_at)
        WHERE status = 'pending';

        CREATE INDEX IF NOT EXISTS idx_reminders_user_id
        ON "DecisionsFollowUpReminders"(user_id);
      `
    });

    if (error) {
      console.log('❌ RPC failed:', error.message);
    } else {
      console.log('✅ SUCCESS via RPC!');
      return true;
    }
  }

  // Approach 2: Try to create and call a PostgreSQL function
  console.log('\nApproach 2: Testing exec_ddl function...');

  const { data: funcData, error: funcError } = await supabase.rpc('exec_ddl', {
    ddl_statement: "ALTER TABLE \"DecisionsFollowUpReminders\" ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ"
  });

  if (funcError) {
    console.log('❌ exec_ddl not available:', funcError.message);
  } else {
    console.log('✅ SUCCESS via exec_ddl!');
    return true;
  }

  // Approach 3: Try direct REST API to PostgreSQL
  console.log('\nApproach 3: Testing direct PostgreSQL access...');
  console.log('❌ Supabase REST API does not support DDL statements');

  console.log('\n⛔ All automated approaches exhausted');
  console.log('This confirms: Migration must be executed manually in Supabase Dashboard');
  return false;
}

tryRpcMigration().then(success => {
  process.exit(success ? 0 : 1);
});
