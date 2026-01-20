// Check if there are any decisions with legacy outcomes
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLegacyOutcomes() {
  console.log('Checking for decisions with legacy outcomes...');

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, outcome, outcome_notes, outcome_recorded_at')
    .not('outcome', 'is', null)
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (!decisions || decisions.length === 0) {
    console.log('No decisions with legacy outcomes found.');
    return;
  }

  console.log(`Found ${decisions.length} decisions with outcomes:`);
  decisions.forEach(d => {
    console.log(`- ${d.title}`);
    console.log(`  Outcome: ${d.outcome}`);
    console.log(`  ID: ${d.id}`);
  });
}

checkLegacyOutcomes();
