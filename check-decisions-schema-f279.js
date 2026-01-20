const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  // Try to get one decision to see the schema
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in decisions table:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('No decisions found');
  }
}

checkSchema().catch(console.error);
