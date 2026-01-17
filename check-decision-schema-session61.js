const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .limit(1);

    if (error) throw error;
    console.log('Sample decision:', JSON.stringify(data[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
