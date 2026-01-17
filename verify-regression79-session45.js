const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDecision() {
  // Get the decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .select('*')
    .eq('title', 'REGRESSION_TEST_79_SESSION45')
    .single();

  if (decisionError) {
    console.error('Error fetching decision:', decisionError);
    return;
  }

  console.log('\n=== Decision Details ===');
  console.log('Title:', decision.title);
  console.log('Category ID:', decision.category_id);
  console.log('Emotional State:', decision.emotional_state);
  console.log('Status:', decision.status);
  console.log('Created At:', decision.created_at);
  console.log('Decision ID:', decision.id);

  // Get the options
  const { data: options, error: optionsError } = await supabase
    .from('decision_options')
    .select('*')
    .eq('decision_id', decision.id)
    .order('created_at', { ascending: true });

  if (optionsError) {
    console.error('Error fetching options:', optionsError);
    return;
  }

  console.log('\n=== Options ===');
  console.log('Total options:', options.length);
  options.forEach((opt, idx) => {
    console.log(`\nOption ${idx + 1}:`, opt.title);
    console.log('  ID:', opt.id);
  });

  // Get pros and cons for each option
  for (const option of options) {
    const { data: pros, error: prosError } = await supabase
      .from('decision_pros_cons')
      .select('*')
      .eq('option_id', option.id)
      .eq('type', 'pro');

    const { data: cons, error: consError } = await supabase
      .from('decision_pros_cons')
      .select('*')
      .eq('option_id', option.id)
      .eq('type', 'con');

    console.log(`\n  Pros for "${option.title}": ${pros?.length || 0}`);
    pros?.forEach(pro => console.log(`    - ${pro.content}`));

    console.log(`  Cons for "${option.title}": ${cons?.length || 0}`);
    cons?.forEach(con => console.log(`    - ${con.content}`));
  }

  console.log('\n✅ Verification complete!');
}

verifyDecision();
