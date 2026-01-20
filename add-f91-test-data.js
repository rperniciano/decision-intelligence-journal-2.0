// Test data for Feature #91: Record detailed outcome with rating
// Creates a decided decision with outcome

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc';

async function createTestData() {
  console.log('Creating test data for Feature #91...');

  const supabase = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey);

  const testEmail = 'test91-verification@example.com';
  const testPassword = 'TestPass123!';

  // 1. Sign up user
  console.log('1. Creating test user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('Auth error:', authError);
    return;
  }

  let userId;
  if (authData.user) {
    userId = authData.user.id;
    console.log('User created:', userId);
  } else {
    // User already exists, try to get them
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    userId = signInData.user.id;
    console.log('Existing user:', userId);
  }

  // 2. Create profile if needed (skip profile creation, just log)

  // 3. Create a decided decision (we need a decided decision to record outcome on)
  console.log('2. Creating test decision...');
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F91_TEST_DECISION: Job Offer Decision',
      status: 'decided',
      detected_emotional_state: 'excited',
      decided_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Decision error:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);

  // 4. Create options
  console.log('3. Creating options...');
  const options = [
    { name: 'Accept the offer', position: 1, is_chosen: true },
    { name: 'Negotiate', position: 2, is_chosen: false },
    { name: 'Decline', position: 3, is_chosen: false }
  ];

  for (const opt of options) {
    const { error: optError } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        name: opt.name,
        position: opt.position,
        is_chosen: opt.is_chosen
      });

    if (optError) console.error('Option error:', optError);
  }

  console.log('\n========================================');
  console.log('Feature #91 Test Data Created Successfully');
  console.log('========================================');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('Decision ID:', decision.id);
  console.log('Decision Title:', decision.title);
  console.log('Status:', decision.status);
  console.log('\nYou can now:');
  console.log('1. Log in with these credentials');
  console.log('2. Navigate to the decision detail page');
  console.log('3. Click "Record Outcome"');
  console.log('4. Select result (better/worse/as_expected)');
  console.log('5. Set satisfaction rating (1-5 stars)');
  console.log('6. Add optional notes');
  console.log('7. Submit and verify outcome is recorded');
  console.log('========================================\n');
}

createTestData().catch(console.error);
