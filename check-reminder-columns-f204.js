// Check the actual columns in DecisionsFollowUpReminders
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Table is empty, but accessible');
    // Try to insert a test row to see what columns are expected
    const { error: insertError } = await supabase
      .from('DecisionsFollowUpReminders')
      .insert({})
      .select();

    console.log('Insert error (shows expected columns):', insertError.message);
  }
}

checkSchema();
