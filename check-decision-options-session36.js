const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisionOptions() {
  const decisionId = 'e6c199c3-4abb-4569-8042-858dbf9c8c4d';

  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', decisionId);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Options for decision ${decisionId}:`, JSON.stringify(data, null, 2));
    console.log(`\nTotal options: ${data.length}`);
  }
}

checkDecisionOptions();
