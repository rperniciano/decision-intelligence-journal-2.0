// Create test decisions via API for Feature #221 regression testing
const testEmail = 'regression-test-f221@example.com';
const testPassword = 'test123456';

async function createTestDecisions() {
  const API_URL = 'http://localhost:3001';

  try {
    // 1. Sign in
    console.log('Signing in...');
    const signInResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (!signInResponse.ok) {
      throw new Error(`Sign in failed: ${signInResponse.status}`);
    }

    const { data: { session } } = await signInResponse.json();
    const token = session.access_token;
    console.log('✅ Signed in successfully');

    // 2. Create first test decision
    console.log('Creating first test decision...');
    const decision1Response = await fetch(`${API_URL}/api/v1/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Decision for Feature #221',
        description: 'This decision will be deleted to test confirmation messages',
        status: 'pending',
        options: [
          { title: 'Option A', description: 'Test option A', pros_cons: [] },
          { title: 'Option B', description: 'Test option B', pros_cons: [] }
        ],
        pros_cons: {
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1']
        },
        emotional_state: 'neutral'
      })
    });

    if (!decision1Response.ok) {
      const error = await decision1Response.text();
      throw new Error(`Failed to create decision 1: ${error}`);
    }

    const decision1 = await decision1Response.json();
    console.log('✅ First test decision created!');
    console.log('   Decision ID:', decision1.data.id);

    // 3. Create second test decision
    console.log('Creating second test decision...');
    const decision2Response = await fetch(`${API_URL}/api/v1/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Another Test Decision',
        description: 'This will remain after testing',
        status: 'pending',
        options: [
          { title: 'Option X', description: 'Test option X', pros_cons: [] }
        ],
        pros_cons: {
          pros: ['Pro X'],
          cons: []
        },
        emotional_state: 'confident'
      })
    });

    if (!decision2Response.ok) {
      const error = await decision2Response.text();
      throw new Error(`Failed to create decision 2: ${error}`);
    }

    const decision2 = await decision2Response.json();
    console.log('✅ Second test decision created!');
    console.log('   Decision ID:', decision2.data.id);

    console.log('\n✅ All test data ready!');
    console.log('\nYou can now log in and test the delete confirmation feature:');
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createTestDecisions();
