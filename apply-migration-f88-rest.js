/**
 * Apply migration for Feature #88 using Supabase REST API
 *
 * This script attempts to apply the migration by directly calling PostgreSQL
 * through Supabase's REST API with the service role key.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

// Parse project ID from URL
const projectId = supabaseUrl.match(/https:\/\/([\w-]+)\.supabase\.co/)[1];
console.log(`📦 Project ID: ${projectId}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Execute raw SQL through Supabase RPC
 * We'll create a temporary SQL function that executes the migration
 */
async function executeMigrationSQL() {
  console.log('🔧 Attempting to apply migration for Feature #88...\n');

  // SQL to create a temporary function for migration
  const migrationFunctionSQL = `
    CREATE OR REPLACE FUNCTION apply_abandonment_migration()
    RETURNS void AS $$
    BEGIN
      -- Add abandon_reason column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'decisions' AND column_name = 'abandon_reason'
      ) THEN
        ALTER TABLE decisions ADD COLUMN abandon_reason VARCHAR(50);
      END IF;

      -- Add abandon_note column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'decisions' AND column_name = 'abandon_note'
      ) THEN
        ALTER TABLE decisions ADD COLUMN abandon_note TEXT;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    // Try to execute the function creation
    // Note: This may not work due to security restrictions
    console.log('📝 Creating migration function...');

    // We'll use the rpc() method with a different approach
    // Instead, let's try to use the PostgreSQL client directly if available

    console.log('\n⚠️  Supabase JS client has security restrictions that prevent DDL operations.');
    console.log('⚠️  Direct SQL execution requires either:');
    console.log('   1. DATABASE_URL environment variable (PostgreSQL connection string)');
    console.log('   2. Manual execution in Supabase Dashboard SQL Editor\n');

    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Alternative: Check if we can use psql with connection string
 */
async function tryPostgreSQLConnection() {
  console.log('🔍 Checking for PostgreSQL connection string...\n');

  // Check if DATABASE_URL exists
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.log('❌ No DATABASE_URL found in environment variables\n');
    console.log('💡 To enable automated migrations, add to .env:');
    console.log('   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres\n');
    console.log('   Get the password from: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/settings/database\n');
    return false;
  }

  console.log('✅ DATABASE_URL found!');
  console.log('⚠️  Note: Would require "pg" package to execute SQL');
  console.log('    Run: npm install pg\n');

  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('================================================================================');
  console.log('Feature #88 Migration: Add abandon_reason and abandon_note columns');
  console.log('================================================================================\n');

  // Try REST API approach
  const restResult = await executeMigrationSQL();

  // Try PostgreSQL approach
  const pgResult = await tryPostgreSQLConnection();

  if (!restResult && !pgResult) {
    console.log('================================================================================');
    console.log('⛔ AUTOMATED MIGRATION NOT POSSIBLE');
    console.log('================================================================================\n');
    console.log('📋 MANUAL MIGRATION REQUIRED\n');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
    console.log('2. Execute this SQL:\n');
    console.log('─'.repeat(70));
    console.log(`-- Add abandon_reason column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

-- Add abandon_note column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comment for documentation
COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions (e.g., "too_complex", "no_longer_relevant", "outside_influence")';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';`);
    console.log('─'.repeat(70));
    console.log('\n3. After applying migration, run:');
    console.log('   node check-and-apply-migration-f88.js\n');
    console.log('================================================================================\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
