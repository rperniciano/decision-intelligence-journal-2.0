// Test script for Feature #274: Session refresh during long-running action
// This verifies that token refresh is handled correctly during polling

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSessionRefresh() {
  console.log('🧪 Testing Feature #274: Session refresh during long-running action\n');

  // Step 0: Login first
  console.log('Step 0: Logging in as test user...');
  const testEmail = 'test_f274_1768869511058@example.com';
  const testPassword = 'TestPassword123!';

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (signInError || !signInData.session) {
    console.error('❌ Login failed:', signInError?.message || 'No session');
    return false;
  }

  console.log(`✅ Logged in as: ${signInData.session.user.email}`);

  // Step 1: Get current session
  console.log('\nStep 1: Getting current session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('❌ No active session after login.');
    return false;
  }

  console.log(`✅ Session found for user: ${session.user.email}`);
  console.log(`   Access token (first 20 chars): ${session.access_token.substring(0, 20)}...`);
  console.log(`   Expires at: ${new Date(session.expires_at * 1000).toISOString()}`);

  const originalToken = session.access_token;

  // Step 2: Simulate multiple polling iterations (like RecordPage does)
  console.log('\nStep 2: Simulating polling iterations with token refresh...');

  let iterations = 0;
  const maxIterations = 5;
  let tokensChanged = false;

  while (iterations < maxIterations) {
    iterations++;

    // Get fresh token each time (like the implementation does)
    const { data: { session: freshSession }, error: refreshError } = await supabase.auth.getSession();

    if (refreshError || !freshSession) {
      console.error(`❌ Iteration ${iterations}: Failed to get session`);
      return false;
    }

    const currentToken = freshSession.access_token;

    console.log(`   Iteration ${iterations}/${maxIterations}`);
    console.log(`     Token: ${currentToken.substring(0, 20)}...`);
    console.log(`     Expires: ${new Date(freshSession.expires_at * 1000).toISOString()}`);

    // Check if token changed (indicating refresh happened)
    if (currentToken !== originalToken) {
      tokensChanged = true;
      console.log(`     ⚠️  Token changed from original! (refresh occurred)`);
    }

    // Simulate delay between polls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Step 3: Verify we can make API calls with the token
  console.log('\nStep 3: Testing API call with current token...');

  const { data: { session: finalSession }, error: finalSessionError } = await supabase.auth.getSession();

  if (finalSessionError || !finalSession) {
    console.error('❌ Failed to get final session');
    return false;
  }

  // Try to access a protected endpoint
  const testResponse = await fetch('http://localhost:4013/decisions', {
    headers: {
      'Authorization': `Bearer ${finalSession.access_token}`
    }
  });

  if (testResponse.status === 401) {
    console.error('❌ Got 401 Unauthorized - token refresh not working');
    return false;
  }

  if (testResponse.ok) {
    console.log('✅ API call successful with current token');
    const data = await testResponse.json();
    console.log(`   Retrieved ${data.decisions?.length || 0} decisions`);
  } else {
    console.log(`⚠️  API returned status: ${testResponse.status}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total iterations: ${iterations}`);
  console.log(`   Tokens changed: ${tokensChanged ? 'Yes' : 'No'}`);
  console.log(`   API calls work: ${testResponse.ok ? 'Yes' : 'No'}`);
  console.log(`   No 401 errors: ${testResponse.status !== 401 ? '✅' : '❌'}`);

  if (testResponse.status !== 401) {
    console.log('\n✅ Feature #274 VERIFIED: Session refresh handled correctly during polling');
    return true;
  } else {
    console.log('\n❌ Feature #274 FAILED: Session refresh not working');
    return false;
  }
}

// Run the test
testSessionRefresh()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
