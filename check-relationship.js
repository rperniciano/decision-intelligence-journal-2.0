const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRelationship() {
  console.log('Checking relationship between decisions and reminders...\n');

  // Try getting decisions with reminders
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, DecisionsFollowUpReminders(id, remind_at)')
    .limit(1);

  if (error) {
    console.error('Error:', error);

    // Try without reminders
    console.log('\nTrying export without reminders...\n');
    const { data: decisions2, error: error2 } = await supabase
      .from('decisions')
      .select(`
        id, title,
        options!options_decision_id_fkey(id, title)
      `)
      .limit(1);

    if (error2) {
      console.error('Error2:', error2);
    } else {
      console.log('✓ Options relationship works:', decisions2);
    }
  } else {
    console.log('✓ Reminders relationship works:', data);
  }
}

checkRelationship().then(() => process.exit(0));
