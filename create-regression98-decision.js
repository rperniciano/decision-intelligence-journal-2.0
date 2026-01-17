const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createDecisionWithProsCons() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'REGRESSION_98_PROSCONS_TEST',
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

  // Create an option
  const { data: option, error: optionError } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'Option A',
      description: 'First option'
    })
    .select()
    .single();

  if (optionError) {
    console.error('Error creating option:', optionError);
    return;
  }

  console.log('Option created:', option.id);

  // Create pros and cons
  const prosConsData = [
    {
      option_id: option.id,
      type: 'pro',
      content: 'Pro 1: This is a great advantage'
    },
    {
      option_id: option.id,
      type: 'pro',
      content: 'Pro 2: Another benefit'
    },
    {
      option_id: option.id,
      type: 'con',
      content: 'Con 1: This is a drawback'
    },
    {
      option_id: option.id,
      type: 'con',
      content: 'Con 2: Another disadvantage'
    }
  ];

  const { data: prosCons, error: prosConsError } = await supabase
    .from('pros_cons')
    .insert(prosConsData)
    .select();

  if (prosConsError) {
    console.error('Error creating pros/cons:', prosConsError);
    return;
  }

  console.log('Created', prosCons.length, 'pros/cons');
  console.log('✅ Decision ready for testing');
  console.log('URL: /decisions/' + decision.id + '/edit');
}

createDecisionWithProsCons();
