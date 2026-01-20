const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOptionsSchema() {
  try {
    // Try to get one option to see schema
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('Options table columns:', Object.keys(data[0]));
    } else {
      console.log('No options found, but table exists');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkOptionsSchema();
