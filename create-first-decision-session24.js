const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFirstDecision() {
  const userEmail = 'session24test@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === userEmail);

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating decision for user:', user.email, 'ID:', user.id);

  // Get a category
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .limit(1);

  const categoryId = categories[0].id;
  console.log('Using category:', categories[0].name);

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'FIRST_DECISION_SESSION24_TEST',
      description: 'This is my first decision for testing empty state.',
      status: 'decided',
      category_id: categoryId
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Decision created:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   Status:', decision.status);

  // Add an option
  const { data: option, error: optionError } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      text: 'Test Option A'
    })
    .select()
    .single();

  if (optionError) {
    console.error('Error creating option:', optionError);
  } else {
    console.log('✅ Option created:', option.text);
  }
}

createFirstDecision();
