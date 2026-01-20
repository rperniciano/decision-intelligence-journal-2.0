const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRemindersTable() {
  const { data: reminders, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (reminders && reminders.length > 0) {
    console.log('Reminders fields:', Object.keys(reminders[0]).sort());
  } else {
    console.log('No reminders found, checking schema via different method...');
    // Try to get column info
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'DecisionsFollowUpReminders' });

    if (colError) {
      console.error('Could not get columns:', colError.message);
    }
  }
}

checkRemindersTable().then(() => process.exit(0));
