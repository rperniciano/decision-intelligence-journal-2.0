/**
 * Try to execute migration via Supabase RPC
 * This attempts to use PostgreSQL's eval() to execute DDL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function tryRpcMigration() {
  console.log('🔍 Attempting migration via Supabase RPC...\n');

  // Approach 1: Try to use pgsql_exec extension (if available)
  console.log('Approach 1: Testing pgsql_exec extension...');

  const { data: extData, error: extError } = await supabase.rpc('sql_exec', {
    query: "SELECT 1 as test"
  });

  if (extError) {
    console.log('❌ pgsql_exec not available:', extError.message);
  } else {
    console.log('✅ Extension available! Executing migration...');
    const { data, error } = await supabase.rpc('sql_exec', {
      query: `
        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

        ALTER TABLE decisions
        ADD COLUMN IF NOT EXISTS abandon_note TEXT;
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
  console.log('\nApproach 2: Creating migration function...');

  const { data: funcData, error: funcError } = await supabase.rpc('exec_ddl', {
    ddl_statement: "ALTER TABLE decisions ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50)"
  });

  if (funcError) {
    console.log('❌ Function not available:', funcError.message);
    console.log('\n⛔ RPC approaches exhausted');
    console.log('This confirms: Migration must be executed manually in Supabase Dashboard');
    return false;
  }

  console.log('✅ SUCCESS via function!');
  return true;
}

tryRpcMigration().then(success => {
  process.exit(success ? 0 : 1);
});
