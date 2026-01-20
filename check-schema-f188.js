const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  // Try to get one decision to see the schema
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (decisions && decisions.length > 0) {
    console.log('Decision columns:', Object.keys(decisions[0]));
  } else {
    console.log('No decisions found, but table exists');
  }
}

checkSchema();
