const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOptions() {
  const { data, error } = await supabase
    .from('options')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Options columns:', Object.keys(data[0]));
  } else {
    console.log('No options found');
  }
}

checkOptions();
