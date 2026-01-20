// Check the actual schema of DecisionsFollowUpReminders
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  // Query existing reminders to see the schema
  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(5);

  if (error) {
    console.log('Error querying table:', error.message);
    console.log('Error hint:', error.hint);
    console.log('Error details:', error.details);
    return;
  }

  if (data && data.length > 0) {
    console.log('Found', data.length, 'reminders');
    console.log('Columns:', Object.keys(data[0]));
    console.log('\\nSample reminder:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Table is empty');
  }

  // Also check if we can get the PostgreSQL schema
  const { data: schemaData, error: schemaError } = await supabase
    .rpc('get_table_columns', { table_name: 'DecisionsFollowUpReminders' });

  if (schemaError) {
    console.log('\\nCannot get schema via RPC (function may not exist)');
  } else {
    console.log('\\nSchema columns:', schemaData);
  }
}

checkSchema();
