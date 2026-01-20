const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function findUserWithOutcome() {
  // Find decisions with outcomes
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('user_id, id, title, outcome')
    .not('outcome', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (decisions && decisions.length > 0) {
    console.log(`Found ${decisions.length} decisions with outcomes:`);
    for (const d of decisions) {
      console.log(`- Decision ${d.id}: "${d.title}" by user ${d.user_id}`);
      console.log(`  Outcome: ${JSON.stringify(d.outcome)}`);
    }
  } else {
    console.log('No decisions with outcomes found.');
  }
}

findUserWithOutcome();
