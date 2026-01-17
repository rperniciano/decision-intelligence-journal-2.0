const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPersonalDecision() {
  // Get session24test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'session24test@example.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  // Get Relationships category ID
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Relationships')
    .limit(1)
    .single();

  // Create decision in Relationships category
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'RELATIONSHIPS_DECISION_REGRESSION_TEST',
      category_id: categories.id,
      status: 'decided',
      detected_emotional_state: 'calm'
    })
    .select()
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Created Relationships decision:', decision.id);
  }
}

createPersonalDecision();
