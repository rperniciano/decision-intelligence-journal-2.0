// Create a test decision via API for Feature #221 regression testing
const testEmail = 'regression-test-f221@example.com';
const testPassword = 'test123456';

async function createDecision() {
  const API_URL = 'http://localhost:4002';

  try {
    // 1. Sign in
    console.log('Signing in...');
    const signInResponse = await fetch(`${API_URL}/api/v1/login`, {
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

    // 2. Create a test decision
    console.log('Creating test decision...');
    const decisionResponse = await fetch(`${API_URL}/api/v1/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Decision for Delete Confirmation',
        description: 'This decision tests Feature #221 - delete confirmation message',
        status: 'pending',
        emotional_state: 'confident'
      })
    });

    if (!decisionResponse.ok) {
      const error = await decisionResponse.text();
      throw new Error(`Failed to create decision: ${error}`);
    }

    const decision = await decisionResponse.json();
    console.log('✅ Test decision created!');
    console.log('   Decision ID:', decision.data.id);
    console.log('   Title:', decision.data.title);
    console.log('\nNavigate to: http://localhost:5173/decisions/' + decision.data.id);
    console.log('Then click Delete to verify the success message appears.');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createDecision();
