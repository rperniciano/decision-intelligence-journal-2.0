const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSatisfactionValidation() {
  const email = 'f213-test-1768884740999@example.com';
  const password = 'Test123456';
  const decisionId = '86fe74f1-eb56-44df-a315-14e9ef023d45';
  const apiUrl = 'http://localhost:4017';

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Sign in to get token
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  const token = signInData.session.access_token;
  console.log('Signed in successfully');

  // Test 1: Try satisfaction = 0 (below minimum)
  console.log('\n=== Test 1: Satisfaction = 0 (should fail) ===');
  const response1 = await fetch(`${apiUrl}/api/v1/decisions/${decisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: 0,
      notes: 'Test satisfaction 0',
    }),
  });

  const result1 = await response1.json();
  console.log('Status:', response1.status);
  console.log('Response:', result1);

  // Test 2: Try satisfaction = 6 (above maximum)
  console.log('\n=== Test 2: Satisfaction = 6 (should fail) ===');
  const response2 = await fetch(`${apiUrl}/api/v1/decisions/${decisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: 6,
      notes: 'Test satisfaction 6',
    }),
  });

  const result2 = await response2.json();
  console.log('Status:', response2.status);
  console.log('Response:', result2);

  // Test 3: Try satisfaction = -1 (negative)
  console.log('\n=== Test 3: Satisfaction = -1 (should fail) ===');
  const response3 = await fetch(`${apiUrl}/api/v1/decisions/${decisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: -1,
      notes: 'Test satisfaction -1',
    }),
  });

  const result3 = await response3.json();
  console.log('Status:', response3.status);
  console.log('Response:', result3);

  // Test 4: Try satisfaction = 1.5 (non-integer)
  console.log('\n=== Test 4: Satisfaction = 1.5 (non-integer, should fail) ===');
  const response4 = await fetch(`${apiUrl}/api/v1/decisions/${decisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: 1.5,
      notes: 'Test satisfaction 1.5',
    }),
  });

  const result4 = await response4.json();
  console.log('Status:', response4.status);
  console.log('Response:', result4);

  // Test 5: Valid satisfaction = 5 (should succeed)
  console.log('\n=== Test 5: Satisfaction = 5 (valid, should succeed) ===');
  const response5 = await fetch(`${apiUrl}/api/v1/decisions/${decisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: 5,
      notes: 'Test satisfaction 5 (valid)',
    }),
  });

  const result5 = await response5.json();
  console.log('Status:', response5.status);
  console.log('Response:', result5);

  // Test 6: Valid satisfaction = 1 (should succeed)
  console.log('\n=== Test 6: Satisfaction = 1 (valid, should succeed) ===');
  const response6 = await fetch(`${apiUrl}/api/v1/decisions/${decisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: 1,
      notes: 'Test satisfaction 1 (valid)',
    }),
  });

  const result6 = await response6.json();
  console.log('Status:', response6.status);
  console.log('Response:', result6);

  // Summary
  console.log('\n=== VALIDATION TEST SUMMARY ===');
  console.log('Test 1 (satisfaction=0):', response1.status === 400 ? '✅ REJECTED' : '❌ FAILED TO REJECT');
  console.log('Test 2 (satisfaction=6):', response2.status === 400 ? '✅ REJECTED' : '❌ FAILED TO REJECT');
  console.log('Test 3 (satisfaction=-1):', response3.status === 400 ? '✅ REJECTED' : '❌ FAILED TO REJECT');
  console.log('Test 4 (satisfaction=1.5):', response4.status === 400 ? '✅ REJECTED' : '❌ FAILED TO REJECT');
  console.log('Test 5 (satisfaction=5):', response5.status === 200 ? '✅ ACCEPTED' : '❌ FAILED TO ACCEPT');
  console.log('Test 6 (satisfaction=1):', response6.status === 200 ? '✅ ACCEPTED' : '❌ FAILED TO ACCEPT');
}

testSatisfactionValidation();
