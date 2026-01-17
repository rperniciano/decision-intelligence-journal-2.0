const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'CASCADE_TEST_SESSION53_DELETE_ME',
      status: 'in_progress',
      detected_emotional_state: 'confident'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);

  // Create options
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .insert([
      { decision_id: decision.id, title: 'Option A', display_order: 0 },
      { decision_id: decision.id, title: 'Option B', display_order: 1 }
    ])
    .select();

  if (optionsError) {
    console.error('Error creating options:', optionsError);
    return;
  }

  console.log('Options created:', options.length);

  // Create pros/cons for first option
  const { data: proscons, error: prosconsError } = await supabase
    .from('pros_cons')
    .insert([
      { option_id: options[0].id, type: 'pro', content: 'Pro 1' },
      { option_id: options[0].id, type: 'con', content: 'Con 1' }
    ])
    .select();

  if (prosconsError) {
    console.error('Error creating pros/cons:', prosconsError);
    return;
  }

  console.log('Pros/cons created:', proscons.length);
  console.log('\nSummary:');
  console.log('Decision ID:', decision.id);
  console.log('Options:', options.length);
  console.log('Pros/cons:', proscons.length);
}

createTestDecision();
