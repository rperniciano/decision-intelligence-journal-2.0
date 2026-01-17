const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test user

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'FEATURE_98_SWITCH_PRO_CON_TEST',
      status: 'in_progress',
      detected_emotional_state: 'confident',
      category_id: null,
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Created decision:', decision.id);

  // Create options
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .insert([
      { decision_id: decision.id, title: 'Option A - Full implementation' },
      { decision_id: decision.id, title: 'Option B - Minimal approach' },
    ])
    .select();

  if (optionsError) {
    console.error('Error creating options:', optionsError);
    return;
  }

  console.log('✅ Created options:', options.map(o => o.id));

  // Add pros and cons to Option A
  const { data: prosConsA, error: prosConsErrorA } = await supabase
    .from('pros_cons')
    .insert([
      { option_id: options[0].id, type: 'pro', content: 'Better long-term scalability' },
      { option_id: options[0].id, type: 'pro', content: 'More features for users' },
      { option_id: options[0].id, type: 'con', content: 'Takes longer to develop' },
      { option_id: options[0].id, type: 'con', content: 'Higher initial cost' },
    ])
    .select();

  if (prosConsErrorA) {
    console.error('Error creating pros/cons for Option A:', prosConsErrorA);
    return;
  }

  console.log('✅ Created pros/cons for Option A');

  // Add pros and cons to Option B
  const { data: prosConsB, error: prosConsErrorB } = await supabase
    .from('pros_cons')
    .insert([
      { option_id: options[1].id, type: 'pro', content: 'Quick to implement' },
      { option_id: options[1].id, type: 'pro', content: 'Lower upfront cost' },
      { option_id: options[1].id, type: 'con', content: 'Limited features' },
      { option_id: options[1].id, type: 'con', content: 'May need refactoring later' },
    ])
    .select();

  if (prosConsErrorB) {
    console.error('Error creating pros/cons for Option B:', prosConsErrorB);
    return;
  }

  console.log('✅ Created pros/cons for Option B');
  console.log('\n✅ SUCCESS: Test decision created for Feature #98');
  console.log(`Decision ID: ${decision.id}`);
  console.log(`Title: ${decision.title}`);
  console.log(`Options: ${options.length}`);
  console.log(`Total Pros/Cons: ${prosConsA.length + prosConsB.length}`);
}

createTestDecision();
