const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data: options, error } = await supabase
    .from('options')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (options && options.length > 0) {
    console.log('Options columns:', Object.keys(options[0]));
  } else {
    console.log('No options found');
  }
}

checkSchema();
