const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCategoryValidation() {
  // First, sign in to get a valid token
  const email = 'f215test_1768925952113@example.com';
  const password = 'test123456';

  console.log('Logging in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Login failed:', signInError.message);
    process.exit(1);
  }

  const token = signInData.session.access_token;
  console.log('Login successful!');

  // Test 1: Category name with exactly 50 characters (should succeed)
  console.log('\n=== Test 1: Exactly 50 characters ===');
  const name50 = '12345678901234567890123456789012345678901234567890';
  console.log(`Name length: ${name50.length}`);

  const response1 = await fetch('http://localhost:4001/api/v1/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name50,
      icon: '📁',
      color: '#00d4aa',
    }),
  });

  const result1 = await response1.json();
  console.log('Status:', response1.status);
  console.log('Result:', result1.error || result1.name || 'Success');

  // Test 2: Category name with 51 characters (should fail)
  console.log('\n=== Test 2: 51 characters (should fail) ===');
  const name51 = '123456789012345678901234567890123456789012345678901';
  console.log(`Name length: ${name51.length}`);

  const response2 = await fetch('http://localhost:4001/api/v1/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name51,
      icon: '📁',
      color: '#00d4aa',
    }),
  });

  const result2 = await response2.json();
  console.log('Status:', response2.status);
  console.log('Result:', result2.error || result2.name || 'Failed as expected');

  // Test 3: Category name with 100 characters (should fail)
  console.log('\n=== Test 3: 100 characters (should fail) ===');
  const name100 = 'A'.repeat(100);
  console.log(`Name length: ${name100.length}`);

  const response3 = await fetch('http://localhost:4001/api/v1/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name100,
      icon: '📁',
      color: '#00d4aa',
    }),
  });

  const result3 = await response3.json();
  console.log('Status:', response3.status);
  console.log('Result:', result3.error || result3.name || 'Failed as expected');

  console.log('\n=== All tests completed ===');
}

testCategoryValidation().catch(console.error);
