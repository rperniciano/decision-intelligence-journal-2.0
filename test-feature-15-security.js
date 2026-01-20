/**
 * Feature #15: Cannot access another user's outcomes - Security Test
 *
 * This test verifies that:
 * 1. Users cannot GET outcomes from another user's decisions
 * 2. Users cannot POST outcomes to another user's decisions
 * 3. The API properly validates user ownership
 */

const http = require('http');
require('dotenv').config();

// Configuration
const API_URL = 'localhost:4002';
const TEST_PREFIX = `f15-test-${Date.now()}`;

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Store test data
const testData = {
  userA: {
    email: `${TEST_PREFIX}-user-a@example.com`,
    password: 'TestPassword123!',
    id: null,
    token: null,
    decisionId: null
  },
  userB: {
    email: `${TEST_PREFIX}-user-b@example.com`,
    password: 'TestPassword123!',
    id: null,
    token: null,
    decisionId: null
  }
};

// Helper function to make HTTP requests
function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://${API_URL}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 4001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper function to create user via Supabase
async function createUser(email, password) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // First check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log(`  User already exists: ${email}`);
    return existingUser;
  }

  // Create new user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  console.log(`  ✅ Created user: ${email} (ID: ${authData.user.id})`);
  return authData.user;
}

// Helper to get auth token
async function getUserToken(email, password) {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    throw new Error(`Failed to sign in: ${signInError.message}`);
  }

  return signInData.session.access_token;
}

// Helper to create a decision
async function createDecision(token, title) {
  const response = await makeRequest('POST', '/api/v1/decisions', {
    title,
    status: 'draft',
    category: 'testing'
  }, token);

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Create decision failed: ${JSON.stringify(response.data)}`);
  }

  return response.data.id;
}

/**
 * Test 1: GET outcomes - User A cannot access User B's outcomes
 */
async function testGetOutcomesSecurity() {
  console.log('\n=== Test 1: GET /decisions/:id/outcomes - Security Check ===');
  console.log(`User A tries to GET outcomes from User B's decision (ID: ${testData.userB.decisionId})`);

  const result = await makeRequest('GET', `/api/v1/decisions/${testData.userB.decisionId}/outcomes`, null, testData.userA.token);

  console.log(`Response status: ${result.status}`);
  console.log(`Response data:`, JSON.stringify(result.data, null, 2));

  // Security check: Should return 403 Forbidden or 404 Not Found
  // Current implementation is a TODO stub, so it might return 200 with empty array
  if (result.status === 403 || result.status === 404) {
    console.log('✅ PASS: User A cannot access User B\'s outcomes');
    return true;
  } else if (result.status === 200) {
    console.log('⚠️  SECURITY ISSUE: User A can access User B\'s outcomes endpoint');
    console.log('   (This is expected if the endpoint is a TODO stub without user scoping)');
    return false;
  } else {
    console.log(`❓ UNEXPECTED STATUS: ${result.status}`);
    return false;
  }
}

/**
 * Test 2: POST outcome - User A cannot post outcome to User B's decision
 */
async function testPostOutcomeSecurity() {
  console.log('\n=== Test 2: POST /decisions/:id/outcomes - Security Check ===');
  console.log(`User A tries to POST outcome to User B's decision (ID: ${testData.userB.decisionId})`);

  const result = await makeRequest('POST', `/api/v1/decisions/${testData.userB.decisionId}/outcomes`, {
    result: 'better',
    satisfaction: 5,
    notes: 'This should not work'
  }, testData.userA.token);

  console.log(`Response status: ${result.status}`);
  console.log(`Response data:`, JSON.stringify(result.data, null, 2));

  // Security check: Should return 403 Forbidden or 404 Not Found (0 rows updated)
  if (result.status === 403 || result.status === 404 || result.status === 410) {
    console.log('✅ PASS: User A cannot post outcome to User B\'s decision');
    return true;
  } else if (result.status === 200) {
    console.log('⚠️  SECURITY ISSUE: User A posted outcome to User B\'s decision');
    return false;
  } else {
    console.log(`❓ UNEXPECTED STATUS: ${result.status}`);
    return false;
  }
}

/**
 * Test 3: POST outcome - User B can post outcome to their own decision (sanity check)
 */
async function testPostOutcomeOwnDecision() {
  console.log('\n=== Test 3: POST outcome to own decision - Sanity Check ===');
  console.log(`User B posts outcome to their own decision (ID: ${testData.userB.decisionId})`);

  const result = await makeRequest('POST', `/api/v1/decisions/${testData.userB.decisionId}/outcomes`, {
    result: 'better',
    satisfaction: 5,
    notes: 'This should work'
  }, testData.userB.token);

  console.log(`Response status: ${result.status}`);
  console.log(`Response data:`, JSON.stringify(result.data, null, 2));

  if (result.status === 200 && result.data.success === true) {
    console.log('✅ PASS: User B can post outcome to their own decision');
    return true;
  } else {
    console.log('❌ FAIL: User B cannot post outcome to their own decision');
    return false;
  }
}

/**
 * Test 4: GET outcomes - User B can access their own outcomes (sanity check)
 */
async function testGetOutcomesOwnDecision() {
  console.log('\n=== Test 4: GET outcomes from own decision - Sanity Check ===');
  console.log(`User B GETs outcomes from their own decision (ID: ${testData.userB.decisionId})`);

  const result = await makeRequest('GET', `/api/v1/decisions/${testData.userB.decisionId}/outcomes`, null, testData.userB.token);

  console.log(`Response status: ${result.status}`);
  console.log(`Response data:`, JSON.stringify(result.data, null, 2));

  // Current implementation is a TODO stub, so it returns 200 with empty array
  if (result.status === 200) {
    console.log('✅ PASS: User B can access their own outcomes endpoint');
    return true;
  } else {
    console.log('❌ FAIL: User B cannot access their own outcomes endpoint');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('========================================');
  console.log('Feature #15: Outcomes Security Test');
  console.log('========================================');

  try {
    // Step 1: Create User A
    console.log('\n--- Step 1: Creating User A ---');
    const userA = await createUser(testData.userA.email, testData.userA.password);
    testData.userA.id = userA.id;
    testData.userA.token = await getUserToken(testData.userA.email, testData.userA.password);

    // Step 2: Create User B
    console.log('\n--- Step 2: Creating User B ---');
    const userB = await createUser(testData.userB.email, testData.userB.password);
    testData.userB.id = userB.id;
    testData.userB.token = await getUserToken(testData.userB.email, testData.userB.password);

    // Step 3: Create decisions
    console.log('\n--- Step 3: Creating decisions ---');
    testData.userA.decisionId = await createDecision(testData.userA.token, 'F15 User A Decision');
    testData.userB.decisionId = await createDecision(testData.userB.token, 'F15 User B Decision');
    console.log(`✅ Decisions created`);
    console.log(`   User A decision ID: ${testData.userA.decisionId}`);
    console.log(`   User B decision ID: ${testData.userB.decisionId}`);

    // Step 4: Run security tests
    console.log('\n--- Step 4: Running security tests ---');

    const test1 = await testGetOutcomesSecurity();
    const test2 = await testPostOutcomeSecurity();
    const test3 = await testPostOutcomeOwnDecision();
    const test4 = await testGetOutcomesOwnDecision();

    // Summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Test 1 (GET other user's outcomes - security): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 (POST to other user's decision - security): ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 (POST to own decision - sanity): ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 4 (GET own outcomes - sanity): ${test4 ? '✅ PASS' : '❌ FAIL'}`);

    const allTestsPassed = test1 && test2 && test3 && test4;

    if (allTestsPassed) {
      console.log('\n✅ All tests passed - Feature #15 is secure');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed - Feature #15 needs implementation');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
