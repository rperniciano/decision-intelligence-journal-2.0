const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStructure() {
  // Get a sample decision with options
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, options!options_decision_id_fkey(*)')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample decision with options:', JSON.stringify(decisions, null, 2));
}

checkStructure();
