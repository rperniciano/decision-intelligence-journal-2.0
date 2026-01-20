const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createTestData() {
  console.log('Creating test data for Feature #161...');

  // Create or get test user
  const email = 'test_f161_rapid_delete@example.com';
  const password = 'Test1234';

  // Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  let userId;
  if (signUpError && signUpError.message.includes('already exists')) {
    // Sign in instead
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    userId = signInData.user.id;
    console.log('✅ Signed in existing user');
  } else {
    userId = signUpData.user.id;
    console.log('✅ Created new user');
  }

  // Create a test decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Rapid Delete F161',
      description: 'This decision tests rapid delete clicks',
      status: 'draft',
    })
    .select()
    .single();

  if (decisionError) {
    console.error('❌ Error creating decision:', decisionError);
    process.exit(1);
  }

  console.log('✅ Created test decision:', decision.id);
  console.log('Decision title:', decision.title);
  console.log('\nCredentials:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('\nDecision ID:', decision.id);
}

createTestData();
