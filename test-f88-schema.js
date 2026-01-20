/**
 * Test if abandonment columns exist by querying decisions table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAbandonmentColumns() {
  console.log('🔍 Testing abandonment columns existence...\n');

  try {
    // Try to select abandonment columns
    const { data, error } = await supabase
      .from('decisions')
      .select('id, title, abandon_reason, abandon_note')
      .limit(1);

    if (error) {
      console.log('❌ Error selecting abandonment columns:');
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);

      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('\n⛔ BLOCKER: Columns do not exist in database');
        console.log('Migration needs to be executed manually in Supabase Dashboard');
        return false;
      }
      return false;
    }

    console.log('✅ SUCCESS! Columns exist and are accessible');
    console.log('Query returned successfully');
    console.log('\n🎉 Feature #88 is UNBLOCKED - ready for testing!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testAbandonmentColumns().then(success => {
  process.exit(success ? 0 : 1);
});
