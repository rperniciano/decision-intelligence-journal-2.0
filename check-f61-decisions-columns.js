// Check if decisions table has outcome columns (legacy format)
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDecisionColumns() {
  console.log('🔍 Checking decisions table for outcome columns...\n');

  try {
    // Try to query with outcome columns
    const { data, error } = await supabase
      .from('decisions')
      .select('id, title, outcome, outcome_result, outcome_satisfaction')
      .limit(1);

    if (error) {
      if (error.message.includes('column') || error.code === '42703') {
        console.log('❌ No outcome columns found in decisions table');
        console.log('Error:', error.message);
        return false;
      }
      console.error('❌ Error:', error.message);
      return false;
    }

    console.log('✅ Found outcome columns in decisions table (legacy format)');
    console.log('Columns: id, title, outcome, outcome_result, outcome_satisfaction');

    if (data && data.length > 0) {
      console.log('\n📊 Sample decision:', JSON.stringify(data[0], null, 2));
    }

    return true;

  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

checkDecisionColumns()
  .then(hasLegacy => {
    if (hasLegacy) {
      console.log('\n✅ Can use legacy outcome format for Feature #61 testing');
    } else {
      console.log('\n❌ No outcome storage available - must use outcomes table');
    }
    process.exit(hasLegacy ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
