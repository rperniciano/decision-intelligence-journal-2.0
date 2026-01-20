const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupTestAccount() {
  const email = 'feature204@example.com';
  const password = 'testpass123';

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Feature 204 Test' }
  });

  if (userError) {
    console.log('Error creating user:', userError.message);
    return;
  }

  console.log('User created:', email);
  console.log('Password:', password);
  console.log('User ID:', userData.user.id);

  // Create a profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userData.user.id,
      name: 'Feature 204 Test',
      avatar_url: null,
      decision_score: 50,
      total_decisions: 0,
      positive_outcome_rate: 0
    });

  if (profileError) {
    console.log('Profile error:', profileError.message);
  } else {
    console.log('Profile created successfully');
  }

  // Create some test decisions for searching
  const decisions = [
    {
      user_id: userData.user.id,
      title: 'Buy a new laptop',
      status: 'decided',
      emotional_state: 'excited',
      created_at: new Date().toISOString()
    },
    {
      user_id: userData.user.id,
      title: 'Move to a new apartment',
      status: 'deliberating',
      emotional_state: 'anxious',
      created_at: new Date().toISOString()
    },
    {
      user_id: userData.user.id,
      title: 'Learn TypeScript',
      status: 'in_progress',
      emotional_state: 'motivated',
      created_at: new Date().toISOString()
    },
    {
      user_id: userData.user.id,
      title: 'Adopt a pet dog',
      status: 'draft',
      emotional_state: 'happy',
      created_at: new Date().toISOString()
    },
    {
      user_id: userData.user.id,
      title: 'Start a side business',
      status: 'deliberating',
      emotional_state: 'uncertain',
      created_at: new Date().toISOString()
    }
  ];

  for (const decision of decisions) {
    const { error: decisionError } = await supabase
      .from('decisions')
      .insert(decision);

    if (decisionError) {
      console.log('Decision error:', decisionError.message);
    }
  }

  console.log('Created 5 test decisions for searching');
  console.log('\nYou can now login with:');
  console.log('  Email:', email);
  console.log('  Password:', password);
}

setupTestAccount().then(() => process.exit(0));
