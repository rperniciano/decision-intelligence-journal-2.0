const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking DecisionsFollowUpReminders table for required columns...\n');

  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('id, remind_at, user_id')
    .limit(1);

  if (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Error Code:', error.code);
    console.log('\nThis means the remind_at and/or user_id columns are MISSING.');
    console.log('\nTo fix this, run the migration:');
    console.log('  File: apps/api/migrations/fix-reminders-table-f101.sql');
    console.log('  Location: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    process.exit(1);
  }

  console.log('✅ SUCCESS: Columns exist!');
  console.log('Sample data:', data);
  console.log('\nFeature #101 should work correctly now.');
}

checkSchema().catch(console.error);
