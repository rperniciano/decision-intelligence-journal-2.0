const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestData() {
  const timestamp = Date.now();
  const email = `f213-test-${timestamp}@example.com`;
  const password = 'Test123456';

  console.log('Creating test user for Feature #213:', email);

  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  console.log('User created:', user.id);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create a decision without outcome (we'll add outcome via UI)
  const decisionData = {
    user_id: user.id,
    title: 'F213_SATISFACTION_TEST',
    description: 'Test decision for Feature #213 - satisfaction rating validation',
    status: 'decided',
    decided_at: new Date().toISOString(),
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
  console.log('\n=== TEST CREDENTIALS ===');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decision ID:', decision.id);
}

createTestData().then(() => console.log('\nDone!'));
