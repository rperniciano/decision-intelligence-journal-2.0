// Test script to verify if outcomes table exists for Feature #61
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOutcomesTable() {
  console.log('🔍 Checking if outcomes table exists...\n');

  try {
    // Try to query the outcomes table
    const { data, error, status } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Outcomes table does NOT exist');
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('\n📋 Migration file exists at:');
      console.log('   apps/api/migrations/create_outcomes_table.sql');
      console.log('\n🔧 To fix, run migration in Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
      return false;
    }

    console.log('✅ Outcomes table EXISTS!');
    console.log('Table structure:');

    if (data && data.length > 0) {
      console.log('Sample data:', JSON.stringify(data[0], null, 2));
      console.log(`\n📊 Total outcomes: ${data.length}`);
    } else {
      console.log('(Table is empty - no outcomes yet)');
    }

    return true;

  } catch (err) {
    console.error('❌ Error checking table:', err.message);
    return false;
  }
}

checkOutcomesTable()
  .then(exists => {
    process.exit(exists ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
