const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  // Get column names via PostgreSQL query
  const { data, error } = await supabase.rpc('get_table_columns', {
    table_name: 'DecisionsFollowUpReminders'
  });

  // If RPC doesn't work, try inserting and getting error
  const { data: testData, error: testError } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(1);

  if (testError) {
    console.error('Error:', testError);
  } else if (testData && testData.length > 0) {
    console.log('DecisionsFollowUpReminders columns:');
    console.log(Object.keys(testData[0]));
  } else {
    console.log('No data in table');
  }
}

checkColumns();
