/**
 * Check and apply migration for Feature #88 (abandon_reason and abandon_note columns)
 *
 * This script:
 * 1. Checks if the columns exist in the decisions table
 * 2. If not, applies the migration using Supabase client with service role key
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndApplyMigration() {
  console.log('🔍 Checking database schema for Feature #88 columns...\n');

  try {
    // Check if abandon_reason column exists
    // We'll try to query it and see if we get a column error
    const { data: testData, error: testError } = await supabase
      .from('decisions')
      .select('id, abandon_reason, abandon_note')
      .limit(1);

    if (testError) {
      console.log('❌ Columns do NOT exist');
      console.log('Error:', testError.message);
      console.log('\n📋 Applying migration...\n');

      // Apply migration using raw SQL through RPC
      // First, we need to create a temporary RPC function or use direct SQL
      // Since we can't do ALTER TABLE through the JS client directly,
      // we'll use the approach of checking the actual error message

      console.log('⚠️  Note: Supabase JS client cannot execute DDL (ALTER TABLE) directly.');
      console.log('⚠️  Migration requires:');
      console.log('   1. Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
      console.log('   2. Or psql command with DATABASE_URL\n');

      console.log('📄 Migration SQL to execute manually:');
      console.log('─'.repeat(60));
      console.log(`-- Add abandon_reason column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_reason VARCHAR(50);

-- Add abandon_note column
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS abandon_note TEXT;

-- Add comment for documentation
COMMENT ON COLUMN decisions.abandon_reason IS 'Reason category for abandoned decisions (e.g., "too_complex", "no_longer_relevant", "outside_influence")';
COMMENT ON COLUMN decisions.abandon_note IS 'Optional detailed note explaining why decision was abandoned';`);
      console.log('─'.repeat(60));

      return false;
    } else {
      console.log('✅ Columns EXIST in database!');
      console.log('   - abandon_reason column: PRESENT');
      console.log('   - abandon_note column: PRESENT');

      // Verify we can query them
      if (testData && testData.length > 0) {
        const row = testData[0];
        console.log('\n📊 Sample data:');
        console.log(`   - abandon_reason: ${row.abandon_reason || 'NULL'}`);
        console.log(`   - abandon_note: ${row.abandon_note || 'NULL'}`);
      } else {
        console.log('\n📊 No decisions in database yet (columns exist but no data to display)');
      }

      console.log('\n✅ Migration status: APPLIED');
      console.log('✅ Feature #88 is ready for testing!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    return false;
  }
}

// Run the check
checkAndApplyMigration().then(success => {
  if (success) {
    console.log('\n🎉 Feature #88 is UNBLOCKED - ready to test and mark as passing!');
    process.exit(0);
  } else {
    console.log('\n⛔ Feature #88 remains BLOCKED - pending manual migration');
    process.exit(1);
  }
});
