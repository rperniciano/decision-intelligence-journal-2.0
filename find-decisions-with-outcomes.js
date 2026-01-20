const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function findDecisionsWithOutcomes() {
  console.log('Searching for users with decisions and outcomes...\n');

  // First, try to find outcomes
  const { data: outcomes, error: outcomesError } = await supabase
    .from('outcomes')
    .select('decision_id, user_id')
    .limit(10);

  if (outcomesError) {
    console.log('No outcomes table yet:', outcomesError.message);
    console.log('This is expected if the outcomes migration has not run.\n');

    // Check if there are any decisions at all
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('id, title, user_id')
      .limit(5);

    if (decisionsError) {
      console.error('Error fetching decisions:', decisionsError);
      return;
    }

    if (!decisions || decisions.length === 0) {
      console.log('No decisions found in database.');
      return;
    }

    console.log('Found decisions without outcomes table:');
    decisions.forEach(d => {
      console.log(`  - Decision ${d.id}: "${d.title}" (user: ${d.user_id})`);
    });
    return;
  }

  if (!outcomes || outcomes.length === 0) {
    console.log('No outcomes found.');
    return;
  }

  console.log(`Found ${outcomes.length} outcomes:\n`);

  for (const outcome of outcomes) {
    // Get decision details
    const { data: decision } = await supabase
      .from('decisions')
      .select('id, title, user_id')
      .eq('id', outcome.decision_id)
      .single();

    // Get user email
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.id === outcome.user_id);

    console.log(`Outcome for Decision ${decision?.title || outcome.decision_id}:`);
    console.log(`  Decision ID: ${outcome.decision_id}`);
    console.log(`  User: ${user?.email || outcome.user_id}`);
    console.log(`  URL: http://localhost:5190/decisions/${outcome.decision_id}\n`);
  }

  // Now find decisions WITHOUT outcomes for the same user
  if (outcomes.length > 0) {
    const userId = outcomes[0].user_id;
    const { data: allUserDecisions } = await supabase
      .from('decisions')
      .select('id, title')
      .eq('user_id', userId);

    const decisionIdsWithOutcomes = outcomes.map(o => o.decision_id);
    const decisionsWithoutOutcomes = allUserDecisions.filter(
      d => !decisionIdsWithOutcomes.includes(d.id)
    );

    if (decisionsWithoutOutcomes.length > 0) {
      console.log('\nDecisions WITHOUT outcomes for same user:\n');
      decisionsWithoutOutcomes.forEach(d => {
        console.log(`  - Decision ${d.id}: "${d.title}"`);
        console.log(`    URL: http://localhost:5190/decisions/${d.id}\n`);
      });
    }
  }
}

findDecisionsWithOutcomes().catch(console.error);
