/**
 * Debug authentication for Feature #58
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugAuth() {
  const userEmail = 'feature58-search-test-1768892898086@example.com';
  const userPassword = 'testpass123';

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: userPassword,
  });

  if (signInError) {
    console.error('❌ Sign in error:', signInError.message);
    return;
  }

  const userId = signInData.user.id;
  const token = signInData.session.access_token;

  console.log('User ID:', userId);
  console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

  // Test 1: Get all decisions
  console.log('\n=== Test 1: GET /api/v1/decisions (no auth) ===');
  try {
    const response = await fetch('http://localhost:4001/api/v1/decisions');
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Get all decisions with auth
  console.log('\n=== Test 2: GET /api/v1/decisions (with auth) ===');
  try {
    const response = await fetch('http://localhost:4001/api/v1/decisions', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: Get specific decision by ID
  console.log('\n=== Test 3: GET /api/v1/decisions/:id ===');
  const decisionId = 'cc48c137-7f21-4d04-b754-0e55c6a27a76';
  try {
    const response = await fetch(`http://localhost:4001/api/v1/decisions/${decisionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugAuth().catch(console.error);
