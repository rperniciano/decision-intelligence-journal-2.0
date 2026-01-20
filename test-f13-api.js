// Test Feature #13: API security check - User B cannot access User A's decision
require('dotenv').config();

async function getAuthToken(email, password) {
  const response = await fetch('https://doqojfsldvajmlscpwhu.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + process.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  return data.access_token;
}

async function testDecisionAccess(token, decisionId) {
  const response = await fetch(`http://localhost:4001/api/v1/decisions/${decisionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return {
    status: response.status,
    ok: response.ok
  };
}

(async () => {
  const userBToken = await getAuthToken('feature13_user_b@test.com', 'TestPass123!');
  const decisionId = 'b4e2e3cc-515f-4b40-811a-ed202c5c3dce';

  console.log('Testing API security for Feature #13...\n');
  console.log('User B attempts to access User A\'s decision:', decisionId);

  const result = await testDecisionAccess(userBToken, decisionId);

  console.log('\nAPI Response:');
  console.log('  Status:', result.status);
  console.log('  OK:', result.ok);

  if (result.status === 404) {
    console.log('\n✓ SECURITY TEST PASSED');
    console.log('  User B correctly receives 404 (Not Found)');
    console.log('  Row-Level Security is working correctly!');
  } else if (result.status === 200) {
    console.log('\n✗ SECURITY TEST FAILED');
    console.log('  User B was able to access User A\'s decision!');
    console.log('  This is a CRITICAL security vulnerability!');
  } else {
    console.log('\n? UNEXPECTED RESPONSE');
    console.log('  Status code:', result.status);
  }
})();
