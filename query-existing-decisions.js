import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function queryDecisions() {
  // Query for any decisions that have outcomes
  const { data: outcomes, error } = await supabase
    .from('outcomes')
    .select(`
      *,
      decisions!inner(
        id,
        title,
        user_id
      )
    `)
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found', outcomes.length, 'outcomes');

  // Group by decision
  const byDecision = {};
  outcomes.forEach(o => {
    if (!byDecision[o.decision_id]) {
      byDecision[o.decision_id] = [];
    }
    byDecision[o.decision_id].push(o);
  });

  // Find decisions with multiple check-ins
  for (const [decId, outs] of Object.entries(byDecision)) {
    if (outs.length >= 2) {
      console.log('\n✅ Decision with multiple check-ins:', decId);
      console.log('  Title:', outs[0].decisions.title);
      console.log('  User:', outs[0].decisions.user_id);
      console.log('  Check-ins:', outs.length);
      outs.forEach(o => {
        console.log(`    - Check-in #${o.check_in_number}: ${o.result} (${o.satisfaction}/5)`);
      });
    }
  }

  // Also show check_in_number values
  console.log('\n\nAll check_in_number values:');
  outcomes.forEach(o => {
    console.log(`  Decision ${o.decision_id}: check_in_number=${o.check_in_number}`);
  });
}

queryDecisions().catch(console.error);
