const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTables() {
  console.log('Checking outcomes and outcome_reminders tables...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Try to query the outcomes table to see if it exists
  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log('❌ outcomes table does not exist');
    console.log('\nPlease run this SQL in Supabase SQL Editor:');
    console.log('File: migration-add-outcomes-tables.sql\n');
    process.exit(1);
  } else if (error) {
    console.log('Error checking outcomes table:', error.message);
  } else {
    console.log('✓ outcomes table exists');
  }

  // Check outcome_reminders table
  const { data: reminderData, error: reminderError } = await supabase
    .from('outcome_reminders')
    .select('*')
    .limit(1);

  if (reminderError && reminderError.code === '42P01') {
    console.log('❌ outcome_reminders table does not exist');
    console.log('\nPlease run this SQL in Supabase SQL Editor:');
    console.log('File: migration-add-outcomes-tables.sql\n');
    process.exit(1);
  } else if (reminderError) {
    console.log('Error checking outcome_reminders table:', reminderError.message);
  } else {
    console.log('✓ outcome_reminders table exists');
  }

  console.log('\n✓ All tables exist and are ready');
}

checkTables().catch(console.error);
