// Verify if Feature #88 database columns exist
// This checks if abandon_reason and abandon_note columns are in the decisions table

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking database schema for Feature #88 columns...\n');

  try {
    // Try to query decisions with abandon columns
    const { data, error, status } = await supabase
      .from('decisions')
      .select('id, abandon_reason, abandon_note')
      .limit(1);

    if (error) {
      console.log('❌ Schema check FAILED:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Status: ${status}`);
      console.log('\n💡 BLOCKER CONFIRMED: Database columns do not exist');
      console.log('\n📋 REQUIRED ACTION:');
      console.log('   Execute migration-add-abandonment-columns.sql in Supabase Dashboard');
      console.log('   URL: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
      process.exit(1);
    }

    // If we get here, columns exist
    console.log('✅ Schema check PASSED:');
    console.log('   - abandon_reason column exists');
    console.log('   - abandon_note column exists');
    console.log('\n🎉 Feature #88 can be tested!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

checkSchema();
