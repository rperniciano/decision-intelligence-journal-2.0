// Create test user for Feature #146
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  try {
    const timestamp = Date.now();
    const email = `f146-test-${timestamp}@example.com`;
    const password = 'test123456';

    console.log('Creating test user:', email);

    // Create user with admin API (bypasses email confirmation)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'F146 Test User',
      },
    });

    if (userError) throw userError;

    console.log('✅ User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userData.user.id);

    // Sign in to get a valid session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    // Create a test decision for this user using the API
    const decisionResponse = await fetch('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`,
      },
      body: JSON.stringify({
        title: 'F146 Test Decision - Unsaved Changes Warning',
        description: 'This decision tests the unsaved changes warning feature',
        status: 'draft',
      }),
    });

    if (!decisionResponse.ok) {
      const errorText = await decisionResponse.text();
      console.error('Decision creation failed:', errorText);
      throw new Error('Failed to create decision: ' + errorText);
    }

    const decisionData = await decisionResponse.json();

    console.log('✅ Test decision created!');
    console.log('Decision ID:', decisionData.id);
    console.log('\nYou can now test Feature #146:');
    console.log('1. Log in at http://localhost:5173/login');
    console.log('2. Navigate to: http://localhost:5173/decisions/' + decisionData.id + '/edit');
    console.log('3. Make changes and try to navigate away');
    console.log('4. Verify the unsaved changes warning appears');

  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
