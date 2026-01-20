// Check DecisionsFollowUpReminders table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function checkSchema() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use PostgreSQL query to get table schema
  const { data, error } = await supabase.rpc('get_table_schema', {
    table_name: 'DecisionsFollowUpReminders'
  });

  if (error) {
    console.log('❌ Error:', error.message);

    // Alternative: Select one row to see columns
    const { data: sample, error: err } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(1);

    if (err) {
      console.log('❌ Cannot access table:', err.message);
    } else if (sample && sample.length > 0) {
      console.log('Sample row columns:', Object.keys(sample[0]));
    } else {
      console.log('Table is empty, cannot infer schema');
    }
    return;
  }

  console.log('Table schema:', data);
}

checkSchema().catch(console.error);
