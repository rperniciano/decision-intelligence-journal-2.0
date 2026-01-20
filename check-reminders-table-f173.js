// Check what reminders table exists
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function checkTables() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Try outcome_reminders
  try {
    const { data, error } = await supabase
      .from('outcome_reminders')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ outcome_reminders:', error.message);
    } else {
      console.log('✅ outcome_reminders table exists');
    }
  } catch (e) {
    console.log('❌ outcome_reminders:', e.message);
  }

  // Try DecisionsFollowUpReminders
  try {
    const { data, error } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ DecisionsFollowUpReminders:', error.message);
    } else {
      console.log('✅ DecisionsFollowUpReminders table exists');
      console.log('Sample data:', data);
    }
  } catch (e) {
    console.log('❌ DecisionsFollowUpReminders:', e.message);
  }
}

checkTables().catch(console.error);
