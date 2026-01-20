const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestData() {
  const timestamp = Date.now();
  const email = `satisfaction-test-${timestamp}@example.com`;
  const password = 'Test123456';

  console.log('Creating test user:', email);

  // Create user
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  console.log('User created:', user.id);

  // Wait for user to be fully created
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create a decision with an outcome and satisfaction rating
  const decisionData = {
    user_id: user.id,
    title: 'SATISFACTION_TEST_DECISION',
    description: 'Test decision for satisfaction rating validation',
    status: 'decided',
    chosen_option_id: null,
    decided_at: new Date().toISOString(),
    outcome: 'success', // Enum: success, failure, mixed
    outcome_satisfaction: 3, // Integer 1-5 with CHECK constraint
    outcome_notes: 'Initial satisfaction rating for testing',
    outcome_recorded_at: new Date().toISOString(),
  };

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.error('Decision error:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);
  console.log('Current satisfaction rating:', decision.outcome.satisfaction);
  console.log('\n=== TEST CREDENTIALS ===');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decision ID:', decision.id);
}

createTestData().then(() => console.log('\nDone!'));
