// Test Feature #13: API security check - User A CAN access their own decision
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

  const data = await response.json();
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

(async () => {
  const userAToken = await getAuthToken('feature13_user_a@test.com', 'TestPass123!');
  const decisionId = 'b4e2e3cc-515f-4b40-811a-ed202c5c3dce';

  console.log('Testing API access for User A (owner)...\n');
  console.log('User A attempts to access their own decision:', decisionId);

  const result = await testDecisionAccess(userAToken, decisionId);

  console.log('\nAPI Response:');
  console.log('  Status:', result.status);
  console.log('  OK:', result.ok);
  if (result.data && result.data.title) {
    console.log('  Decision Title:', result.data.title);
  }

  if (result.status === 200 && result.data && result.data.title === 'Feature 13 Test Decision - User A Only') {
    console.log('\n✓ OWNER ACCESS WORKS');
    console.log('  User A can access their own decision');
    console.log('  Row-Level Security allows legitimate access!');
  } else {
    console.log('\n? UNEXPECTED RESPONSE');
  }
})();
