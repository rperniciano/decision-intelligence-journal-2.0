/**
 * Final verification: Check if remind_at and user_id columns exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyColumns() {
  console.log('=== Feature #101: Final Column Verification ===\n');

  // Try to select the missing columns
  console.log('Querying DecisionsFollowUpReminders for remind_at and user_id...');

  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('id, remind_at, user_id')
    .limit(1);

  if (error) {
    console.log('❌ ERROR:', error.message);
    console.log('\nThis confirms the columns do NOT exist.');
    console.log('\nMissing columns:');
    console.log('  - remind_at TIMESTAMPTZ');
    console.log('  - user_id UUID REFERENCES profiles(id)');
    console.log('\nMigration file: migrations/fix-reminders-table-f101.sql');
    console.log('\nExecute manually at:');
    console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    return false;
  }

  console.log('✅ Columns exist! Data sample:', data);
  return true;
}

verifyColumns().then(exists => {
  process.exit(exists ? 0 : 1);
});
