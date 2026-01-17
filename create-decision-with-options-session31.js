const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecisionWithOptions() {
  // Get session30test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'session30test@example.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Creating decision for user:', user.email);

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'Test Decision with Options - Session 31',
      status: 'draft',
      category_id: null,
      description: 'This is a test decision to verify option editing functionality'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);
  console.log('Title:', decision.title);

  // Create three options
  const optionsToCreate = [
    { title: 'Option Alpha', description: 'First option description' },
    { title: 'Option Beta', description: 'Second option description' },
    { title: 'Option Gamma', description: 'Third option description' }
  ];

  for (const opt of optionsToCreate) {
    const { data: option, error: optionError } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: opt.title,
        description: opt.description
      })
      .select()
      .single();

    if (optionError) {
      console.error('Error creating option:', optionError);
    } else {
      console.log('Created option:', option.title, '-', option.id);
    }
  }

  console.log('\nDecision created with 3 options successfully!');
  console.log('Decision ID:', decision.id);
}

createDecisionWithOptions();
