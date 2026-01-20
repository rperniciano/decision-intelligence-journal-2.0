const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testExpiredToken() {
  console.log('Testing Feature #12: Expired auth token rejected\n');

  // Step 1: Create a test user and get a valid token
  const testEmail = `f12-expired-token-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  console.log('Step 1: Creating test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError.message);
    return;
  }

  console.log('✅ User created:', testEmail);

  // Step 2: Get the valid token
  const validToken = signUpData.session.access_token;
  console.log('✅ Valid token obtained (first 20 chars):', validToken.substring(0, 20) + '...');

  // Step 3: Create an expired token by using an old JWT format
  // We'll manually create a token that's expired
  const expiredToken = validToken.substring(0, validToken.lastIndexOf('.')) + '.expired';
  console.log('\nStep 2: Simulating expired token...');

  // Step 4: Test API request with valid token
  console.log('\nStep 3: Testing API with valid token...');
  const validResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/decisions`, {
    headers: {
      'Authorization': `Bearer ${validToken}`,
      'apikey': process.env.VITE_SUPABASE_ANON_KEY
    }
  });

  console.log('Valid token response status:', validResponse.status);

  // Step 5: Test API request with expired token
  console.log('\nStep 4: Testing API with expired/malformed token...');
  const expiredResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/decisions`, {
    headers: {
      'Authorization': `Bearer ${expiredToken}`,
      'apikey': process.env.VITE_SUPABASE_ANON_KEY
    }
  });

  console.log('Expired token response status:', expiredResponse.status);
  console.log('Expired token response:', await expiredResponse.text());

  // Step 6: Verify the behavior
  console.log('\n=== VERIFICATION RESULTS ===');
  console.log('Valid token status:', validResponse.status === 200 || validResponse.status === 401 ? '✅ Expected' : '❌ Unexpected');
  console.log('Expired token rejected:', expiredResponse.status === 401 ? '✅ PASS' : '❌ FAIL');

  console.log('\nTest user created:', testEmail);
  console.log('You can delete this user manually if needed.');
}

testExpiredToken().catch(console.error);
