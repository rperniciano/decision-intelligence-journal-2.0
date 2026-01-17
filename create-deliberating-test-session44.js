const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDeliberatingDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test user

  // Insert decision with deliberating status
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DELIBERATING_TEST_SESSION44',
      description: 'Testing Feature #87 - transition to decided status',
      status: 'in_progress',
      detected_emotional_state: 'anxious',
      category_id: null
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Created deliberating decision:', decision.id);

  // Add options
  const options = [
    { title: 'Option A - Proceed with testing', display_order: 1 },
    { title: 'Option B - Skip this feature', display_order: 2 },
    { title: 'Option C - Test later', display_order: 3 }
  ];

  for (const opt of options) {
    const { error: optError } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: opt.title,
        display_order: opt.display_order
      });

    if (optError) {
      console.error('Error creating option:', optError);
    } else {
      console.log('✅ Created option:', opt.title);
    }
  }

  console.log('\n✅ Decision ready for testing Feature #87');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
}

createDeliberatingDecision();
