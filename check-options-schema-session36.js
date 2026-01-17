const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOptionsSchema() {
  const { data, error } = await supabase
    .from('options')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample option data:', JSON.stringify(data, null, 2));
    if (data.length > 0) {
      console.log('\nSchema fields:', Object.keys(data[0]));
    } else {
      console.log('\nNo options found. Creating a dummy one to check schema...');
    }
  }
}

checkOptionsSchema();
