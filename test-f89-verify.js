const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

async function testF89() {
  console.log('=== Testing Feature #89: Transition to Reviewed Status ===\n');

  const testEmail = `f89-test-${Date.now()}@example.com`;
  const testPassword = 'test123456';

  // 1. Create test user
  console.log('Step 1: Creating test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('Sign up error:', signUpError.message);
    return;
  }

  const user = signUpData.user;
  const session = signUpData.session;

  if (!session) {
    console.log('User created but no session - trying to sign in...');
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (!signInData.session) {
      console.error('Failed to get session');
      return;
    }
  }

  console.log('✓ User created/exists:', testEmail);

  // 2. Create a decision with status 'decided'
  console.log('\nStep 2: Creating a decision with status=decided...');
  const { data: decisions, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'F89 Test Decision - Transition to Reviewed',
      status: 'decided'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✓ Decision created with status=decided');
  console.log('  Decision ID:', decisions.id);

  // 3. Try to record outcome (this should trigger status change to 'reviewed')
  console.log('\nStep 3: Recording outcome via API...');

  // First, let's try direct API call to see if it fails due to enum
  const API_URL = 'http://localhost:4001';

  try {
    const response = await fetch(`${API_URL}/api/v1/decisions/${decisions.id}/outcomes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session ? session.access_token : user.session.access_token}`
      },
      body: JSON.stringify({
        result: 'better',
        satisfaction: 5
      })
    });

    const result = await response.json();
    console.log('API Response status:', response.status);
    console.log('API Response:', result);

    // 4. Check if status changed to 'reviewed'
    console.log('\nStep 4: Checking decision status after outcome...');
    const { data: updatedDecision } = await supabase
      .from('decisions')
      .select('status')
      .eq('id', decisions.id)
      .single();

    console.log('Current status:', updatedDecision.status);

    if (updatedDecision.status === 'reviewed') {
      console.log('\n✅ SUCCESS! Status changed to "reviewed"');
      console.log('Feature #89 is WORKING!');
    } else if (updatedDecision.status === 'decided') {
      console.log('\n⚠️  Status is still "decided" - likely enum blocker');
      console.log('The database enum needs "reviewed" value added');
    } else {
      console.log('\n❓ Unexpected status:', updatedDecision.status);
    }

  } catch (fetchError) {
    console.error('Fetch error:', fetchError.message);
  }

  // Cleanup
  console.log('\nCleaning up test data...');
  await supabase.from('decisions').delete().eq('id', decisions.id);
  await supabase.auth.admin.deleteUser(user.id);
  console.log('✓ Cleanup complete');
}

testF89().catch(console.error);
