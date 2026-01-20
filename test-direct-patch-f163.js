// Direct test of the PATCH endpoint
async function testPatch() {
  const decisionId = '49b145f8-d123-4ec0-a199-44a692958da6';
  const userId = '00a6f566-b5c3-499d-9c8c-03ba58ecf133';

  // First, let's get a valid token by logging in
  const loginResponse = await fetch('http://localhost:4015/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_f277@example.com',
      password: 'test123456'
    }),
  });

  console.log('Login status:', loginResponse.status);
  const loginData = await loginResponse.json();
  console.log('Login data:', JSON.stringify(loginData, null, 2));

  if (!loginData.token) {
    console.error('No token received');
    return;
  }

  // Now try to patch the decision
  const patchResponse = await fetch(`http://localhost:4015/api/v1/decisions/${decisionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({ title: 'Test Direct Update' }),
  });

  console.log('\nPatch status:', patchResponse.status);
  const patchData = await patchResponse.json();
  console.log('Patch response:', JSON.stringify(patchData, null, 2));
}

testPatch().catch(console.error);
