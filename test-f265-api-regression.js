// Regression test for Feature #265: API Concurrent Edit Handling
require('dotenv').config();

async function testApiConcurrentEdits() {
  const API_URL = `http://localhost:${process.env.API_PORT || 4001}/api/v1`;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  console.log('=== Regression Test: Feature #265 - API Concurrent Edit Handling ===\n');
  console.log(`API URL: ${API_URL}\n`);

  // Step 1: Login to get token
  console.log('Step 1: Logging in as test user...');
  let access_token;
  try {
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'feature265-test@example.com',
        password: 'test123456'
      })
    });

    if (!loginResponse.ok) {
      console.log('  Test user does not exist, creating...');
      // Create test user first
      const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: 'feature265-test@example.com',
          password: 'test123456'
        })
      });

      if (!createResponse.ok) {
        console.error('  Failed to create test user:', await createResponse.text());
        return;
      }

      // Now login
      const retryLogin = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: 'feature265-test@example.com',
          password: 'test123456'
        })
      });

      if (!retryLogin.ok) {
        console.error('  Login failed after user creation');
        return;
      }

      const loginData = await retryLogin.json();
      access_token = loginData.access_token;
    } else {
      const loginData = await loginResponse.json();
      access_token = loginData.access_token;
    }

    console.log(`✓ Logged in, got token: ${access_token.substring(0, 20)}...\n`);
  } catch (error) {
    console.error('Error during login:', error.message);
    return;
  }

  // Step 2: Create a test decision
  console.log('Step 2: Creating test decision via API...');
  const createResponse = await fetch(`${API_URL}/decisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      title: 'API Concurrent Edit Test',
      category: 'test',
      status: 'in_progress'
    })
  });

  if (!createResponse.ok) {
    console.error('Error creating decision:', await createResponse.text());
    return;
  }

  const decision = await createResponse.json();
  console.log(`✓ Created decision: ${decision.id}`);
  console.log(`  Initial title: "${decision.title}"`);
  console.log(`  Initial updatedAt: ${decision.updatedAt}\n`);

  // Step 3: Simulate two users reading the decision
  console.log('Step 3: Simulating two users reading the decision...');
  const user1Data = decision;
  const user2Data = { ...decision };
  console.log(`  User1 sees: "${user1Data.title}" at ${user1Data.updatedAt}`);
  console.log(`  User2 sees: "${user2Data.title}" at ${user2Data.updatedAt}\n`);

  // Step 4: User1 updates the decision
  console.log('Step 4: User1 updates the decision...');
  const user1UpdateResponse = await fetch(`${API_URL}/decisions/${decision.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      title: 'User1 Updated via API',
      updatedAt: user1Data.updatedAt
    })
  });

  if (!user1UpdateResponse.ok) {
    console.error('User1 update error:', await user1UpdateResponse.text());
    return;
  }

  const user1Update = await user1UpdateResponse.json();
  console.log(`✓ User1 successfully updated to: "${user1Update.title}"`);
  console.log(`  New updatedAt: ${user1Update.updatedAt}\n`);

  // Step 5: User2 tries to update with stale data (should get CONFLICT)
  console.log('Step 5: User2 tries to update with STALE data...');
  const user2UpdateResponse = await fetch(`${API_URL}/decisions/${decision.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      title: 'User2 Updated via API',
      updatedAt: user2Data.updatedAt  // Still has old updatedAt
    })
  });

  if (user2UpdateResponse.status === 409) {
    const conflictError = await user2UpdateResponse.json();
    console.log(`✓ User2 update got CONFLICT (409) - Expected!`);
    console.log(`  Message: ${conflictError.message}\n`);
  } else if (!user2UpdateResponse.ok) {
    console.error('User2 update error (unexpected):', await user2UpdateResponse.text());
    return;
  } else {
    const user2Update = await user2UpdateResponse.json();
    console.log(`✗ User2 update succeeded (UNEXPECTED): "${user2Update.title}"`);
    console.log('  WARNING: Optimistic locking not working at API level!\n');
    return;
  }

  // Step 6: User2 refreshes and tries again (should succeed)
  console.log('Step 6: User2 refreshes and tries again...');
  const getResponse = await fetch(`${API_URL}/decisions/${decision.id}`, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });

  const refreshedDecision = await getResponse.json();
  console.log(`  User2 refreshes to: "${refreshedDecision.title}" at ${refreshedDecision.updatedAt}`);

  const user2RetryResponse = await fetch(`${API_URL}/decisions/${decision.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      title: 'User2 Updated After Refresh via API',
      updatedAt: refreshedDecision.updatedAt  // Use fresh updatedAt
    })
  });

  if (!user2RetryResponse.ok) {
    console.error('User2 retry error:', await user2RetryResponse.text());
    return;
  }

  const user2Retry = await user2RetryResponse.json();
  console.log(`✓ User2 successfully updated to: "${user2Retry.title}"`);
  console.log(`  New updatedAt: ${user2Retry.updatedAt}\n`);

  // Step 7: Verify final state
  console.log('Step 7: Verifying final state...');
  const finalResponse = await fetch(`${API_URL}/decisions/${decision.id}`, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });

  const finalDecision = await finalResponse.json();
  console.log(`  Final title: "${finalDecision.title}"`);
  console.log(`  Final updatedAt: ${finalDecision.updatedAt}\n`);

  // Cleanup
  console.log('Cleanup: Deleting test decision...');
  await fetch(`${API_URL}/decisions/${decision.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });

  console.log('\n=== Test Complete ===');
  console.log('✅ Feature #265 REGRESSION TEST PASSED');
  console.log('   Optimistic locking prevents concurrent edit conflicts at API level\n');
}

testApiConcurrentEdits().catch(console.error);
