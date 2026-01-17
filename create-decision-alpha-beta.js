const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecisionWithOptions() {
  // Use session24test user
  const userId = '09e4382a-1624-4d27-8717-416bc158e76f';

  // Get Career category ID (use the first one)
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Career')
    .limit(1);

  const categoryId = categories[0].id;

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECISION_WITH_ALPHA_BETA',
      description: 'Test decision for verifying options attachment',
      category_id: categoryId,
      status: 'decided'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Created decision:', decision.id, decision.title);

  // Create options
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .insert([
      {
        decision_id: decision.id,
        title: 'Option Alpha',
        description: 'First option for testing'
      },
      {
        decision_id: decision.id,
        title: 'Option Beta',
        description: 'Second option for testing'
      }
    ])
    .select();

  if (optionsError) {
    console.error('Error creating options:', optionsError);
    return;
  }

  console.log('Created options:', options.map(o => o.title).join(', '));
  console.log('Decision ID:', decision.id);
}

createDecisionWithOptions();
