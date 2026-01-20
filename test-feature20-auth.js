// Simple test to register a user and create decisions
async function testAuth() {
  const API_URL = 'http://localhost:4001';

  // Register
  console.log('1. Registering user...');
  const registerRes = await fetch(`${API_URL}/api/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'feature20-test@example.com',
      password: 'Test123456!',
      name: 'Feature20 User'
    })
  });

  if (registerRes.ok) {
    console.log('✓ Registration successful');
  } else {
    const err = await registerRes.text();
    console.log('Registration failed:', err);
  }

  // Login
  console.log('\n2. Logging in...');
  const loginRes = await fetch(`${API_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'feature20-test@example.com',
      password: 'Test123456!'
    })
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    console.log('✓ Login successful');
    console.log('Token:', data.session?.access_token ? 'exists' : 'missing');

    // Create decisions
    if (data.session?.access_token) {
      console.log('\n3. Creating test decisions...');
      const token = data.session.access_token;

      for (let i = 1; i <= 4; i++) {
        const decRes = await fetch(`${API_URL}/api/v1/decisions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `BULK_DELETE_TEST_20_${i}`,
            status: 'draft'
          })
        });

        if (decRes.ok) {
          const dec = await decRes.json();
          console.log(`✓ Created decision ${i}: ${dec.id} - ${dec.title}`);
        } else {
          console.log(`✗ Failed to create decision ${i}`);
        }
      }
    }
  } else {
    const err = await loginRes.text();
    console.log('Login failed:', err);
  }
}

testAuth();
