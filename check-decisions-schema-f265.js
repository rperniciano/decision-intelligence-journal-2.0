// Check decisions table schema for feature #265
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking decisions table schema...\n');

  // Try to query one decision to see the structure
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying decisions:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Decisions table columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\nSample decision:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No decisions found in database');
  }
}

checkSchema().catch(console.error);
