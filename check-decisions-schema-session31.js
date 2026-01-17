const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (data && data[0]) {
    console.log('Decisions table columns:', Object.keys(data[0]));
  } else if (error) {
    console.error('Error:', error);
  } else {
    console.log('No decisions found');
  }
}

checkSchema();
