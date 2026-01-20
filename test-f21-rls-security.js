// Test Feature #21: Row Level Security prevents API data leakage
// This script tests that users cannot access other users' decisions via the API

const API_BASE = 'http://localhost:4001/api/v1';

// Test user credentials
const USER_A = {
  email: 'f21usera@example.com',
  password: 'F21TestPass123!'
};

const USER_B = {
  email: 'f21userb@example.com',
  password: 'F21TestPass456!'
};

async function testRLS() {
  console.log('=== Testing Feature #21: Row Level Security ===\n');

  try {
    // Step 1: Log in as User A
    console.log('Step 1: Logging in as User A...');
    const loginAResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(USER_A)
    });

    if (!loginAResponse.ok) {
      throw new Error(`User A login failed: ${loginAResponse.status}`);
    }

    const loginAData = await loginAResponse.json();
    const tokenA = loginAData.session.access_token;
    console.log(`✓ User A logged in successfully`);

    // Step 2: Create a decision as User A
    console.log('\nStep 2: Creating a decision as User A...');
    const createResponse = await fetch(`${API_BASE}/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'RLS Test Decision - User A',
        content: 'This decision should only be accessible to User A',
        category: 'Work'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Decision creation failed: ${createResponse.status}`);
    }

    const createdDecision = await createResponse.json();
    const decisionId = createdDecision.id;
    console.log(`✓ Decision created with ID: ${decisionId}`);

    // Step 3: Log in as User B
    console.log('\nStep 3: Logging in as User B...');
    const loginBResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(USER_B)
    });

    if (!loginBResponse.ok) {
      throw new Error(`User B login failed: ${loginBResponse.status}`);
    }

    const loginBData = await loginBResponse.json();
    const tokenB = loginBData.session.access_token;
    console.log(`✓ User B logged in successfully`);

    // Step 4: Try to access User A's decision with User B's token
    console.log('\nStep 4: Attempting to access User A\'s decision with User B\'s token...');
    console.log(`   GET ${API_BASE}/decisions/${decisionId}`);
    console.log(`   Authorization: Bearer ${tokenB.substring(0, 20)}...`);

    const unauthorizedAccessAttempt = await fetch(`${API_BASE}/decisions/${decisionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenB}`
      }
    });

    console.log(`\nResponse Status: ${unauthorizedAccessAttempt.status} ${unauthorizedAccessAttempt.statusText}`);

    const responseData = await unauthorizedAccessAttempt.json();

    // Step 5: Verify the response
    console.log('\nStep 5: Verifying RLS protection...');

    if (unauthorizedAccessAttempt.status === 404) {
      console.log('✓ PASS: Server returned 404 (decision not found)');
      console.log('  This is correct - User B cannot access User A\'s decision');
    } else if (unauthorizedAccessAttempt.status === 403) {
      console.log('✓ PASS: Server returned 403 (forbidden)');
      console.log('  This is correct - User B is forbidden from accessing User A\'s decision');
    } else {
      console.log(`✗ FAIL: Server returned ${unauthorizedAccessAttempt.status}`);
      console.log('  Expected 404 or 403, indicating RLS is NOT working properly!');
      console.log('  Response data:', responseData);
      process.exit(1);
    }

    // Verify no decision data was leaked
    if (responseData.data && responseData.data.id === decisionId) {
      console.log('\n✗ FAIL: Decision data was leaked to User B!');
      console.log('  RLS is NOT working - security breach detected!');
      console.log('  Leaked data:', responseData.data);
      process.exit(1);
    } else {
      console.log('✓ PASS: No decision data leaked in response');
    }

    // Additional test: Try to list all decisions and verify User A's decision is not visible
    console.log('\nAdditional test: Listing User B\'s decisions...');
    const listResponse = await fetch(`${API_BASE}/decisions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenB}`
      }
    });

    const listData = await listResponse.json();
    const userADecisionVisible = listData.data && listData.data.some(d => d.id === decisionId);

    if (userADecisionVisible) {
      console.log('✗ FAIL: User A\'s decision is visible in User B\'s decision list!');
      console.log('  RLS is NOT working in list endpoint!');
      process.exit(1);
    } else {
      console.log('✓ PASS: User A\'s decision is NOT in User B\'s decision list');
    }

    console.log('\n=== Feature #21 RLS Test: PASSED ===');
    console.log('All verification steps passed successfully.');
    console.log('Row Level Security is working correctly.');

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error('This may indicate:');
    console.error('  - Test users do not exist (need to create them first)');
    console.error('  - Backend server is not running on port 4001');
    console.error('  - Database connection issues');
    process.exit(1);
  }
}

// Run the test
testRLS();
