const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyOptionsLinkage() {
  // Get both decisions with their options
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, options!options_decision_id_fkey(id, title, decision_id)')
    .in('title', ['DECISION_WITH_ALPHA_BETA', 'DECISION_WITH_GAMMA']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== OPTIONS LINKAGE VERIFICATION ===\n');

  decisions.forEach(decision => {
    console.log(`Decision: ${decision.title} (${decision.id})`);
    console.log(`  Options (${decision.options.length}):`);
    decision.options.forEach(option => {
      console.log(`    - ${option.title} (id: ${option.id})`);
      console.log(`      decision_id: ${option.decision_id}`);
      console.log(`      Correctly linked: ${option.decision_id === decision.id ? 'YES ✓' : 'NO ✗'}`);
    });
    console.log('');
  });
}

verifyOptionsLinkage();
