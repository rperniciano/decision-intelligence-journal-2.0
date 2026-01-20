// Test Feature #199: Case-insensitive search
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSearch() {
  const email = 'sessionf91@example.com';
  const password = 'test123456';
  const apiUrl = 'http://localhost:4001';

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  const token = signInData.session.access_token;
  console.log('✅ Signed in successfully');

  // Create a test decision with specific title
  const testTitle = 'MyTestDecision';
  console.log(`\nCreating decision: "${testTitle}"`);

  const createResponse = await fetch(`${apiUrl}/api/v1/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: testTitle,
      status: 'deliberating',
      category_name: 'Other',
    }),
  });

  if (!createResponse.ok) {
    console.error('Failed to create decision:', await createResponse.text());
    return;
  }

  const decision = await createResponse.json();
  console.log('✅ Decision created:', decision.id);

  // Test 1: Search in lowercase
  console.log('\n=== Test 1: Search lowercase "mytestdecision" ===');
  const search1 = await fetch(`${apiUrl}/api/v1/decisions?search=mytestdecision`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result1 = await search1.json();
  console.log('Found:', result1.decisions?.length || 0, 'decisions');
  if (result1.decisions?.length > 0) {
    console.log('✅ PASS: Found decision with lowercase search');
  } else {
    console.log('❌ FAIL: Decision not found with lowercase search');
  }

  // Test 2: Search in UPPERCASE
  console.log('\n=== Test 2: Search UPPERCASE "MYTESTDECISION" ===');
  const search2 = await fetch(`${apiUrl}/api/v1/decisions?search=MYTESTDECISION`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result2 = await search2.json();
  console.log('Found:', result2.decisions?.length || 0, 'decisions');
  if (result2.decisions?.length > 0) {
    console.log('✅ PASS: Found decision with UPPERCASE search');
  } else {
    console.log('❌ FAIL: Decision not found with UPPERCASE search');
  }

  // Test 3: Search in Mixed Case
  console.log('\n=== Test 3: Search MixedCase "MyTestDecision" ===');
  const search3 = await fetch(`${apiUrl}/api/v1/decisions?search=MyTestDecision`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result3 = await search3.json();
  console.log('Found:', result3.decisions?.length || 0, 'decisions');
  if (result3.decisions?.length > 0) {
    console.log('✅ PASS: Found decision with MixedCase search');
  } else {
    console.log('❌ FAIL: Decision not found with MixedCase search');
  }

  // Cleanup: Delete the test decision
  console.log('\n=== Cleanup ===');
  await fetch(`${apiUrl}/api/v1/decisions/${decision.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('✅ Test decision deleted');
}

testSearch().catch(console.error);
