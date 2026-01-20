const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('Checking DecisionsFollowUpReminders table for remind_at and user_id columns...\n');

  // Try a query that uses remind_at
  const { data, error } = await supabase
    .from('decisions_follow_up_reminders')
    .select('id, remind_at, user_id')
    .limit(1);

  if (error) {
    console.log('❌ Columns MISSING - remind_at or user_id not found');
    console.log('Error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Columns EXIST - remind_at and user_id available');
    console.log('Sample data:', data);
  }
}

checkSchema().catch(console.error);
