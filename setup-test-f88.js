const timestamp = Date.now().toString();
const email = `f88-test-${timestamp}@example.com`;
const password = 'Test1234!';
const name = 'Regression Test 88';

console.log('Creating user:', email);

async function run() {
  // Register
  const registerRes = await fetch('http://localhost:4001/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  const registerData = await registerRes.json();
  console.log('Register:', JSON.stringify(registerData));

  // Auto-confirm user via admin API
  await fetch(`http://localhost:4001/api/v1/admin/auto-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  // Login
  const loginRes = await fetch('http://localhost:4001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  console.log('Token:', loginData.token ? loginData.token.substring(0, 20) + '...' : 'none');

  // Create deliberating decision
  const decisionRes = await fetch('http://localhost:4001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      title: `Test Abandonment - ${timestamp}`,
      transcript: 'Testing abandonment workflow',
      status: 'deliberating',
      recordedAt: new Date().toISOString()
    })
  });
  const decisionData = await decisionRes.json();
  console.log('Decision ID:', decisionData.id);
  console.log('Decision Status:', decisionData.status);

  // Save credentials for browser test
  const fs = require('fs');
  fs.writeFileSync('/tmp/test-f88-credentials.json', JSON.stringify({
    email,
    password,
    decisionId: decisionData.id
  }, null, 2));
  console.log('Credentials saved to /tmp/test-f88-credentials.json');
}

run().catch(console.error);
