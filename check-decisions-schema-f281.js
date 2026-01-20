const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDecisionsSchema() {
  console.log('Checking DECISIONS table schema...\n');

  try {
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('*')
      .limit(1);

    if (decisions && decisions.length > 0) {
      console.log('Columns:', Object.keys(decisions[0]));
      console.log('\nSample decision:');
      console.log(JSON.stringify(decisions[0], null, 2));
    } else if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('No decisions found');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkDecisionsSchema();
