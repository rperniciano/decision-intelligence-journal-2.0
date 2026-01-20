const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('All columns in decisions table:');
    console.log(Object.keys(data[0]).join('\n'));
  } else {
    // Try to get column info another way
    const { data: decisions } = await supabase.rpc('get_table_columns', { table_name: 'decisions' });
    console.log('Columns via RPC:', decisions);
  }
}

checkColumns();
