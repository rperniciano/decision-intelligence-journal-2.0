/**
 * Feature #13: Cannot access another user's decision by ID manipulation
 *
 * This test verifies that users cannot access decisions belonging to other users
 * by manipulating the decision ID in API calls.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client for setup
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// API base URL
const API_BASE = 'http://localhost:4001/api/v1';

let userAToken: string;
let userBToken: string;
let userAId: string;
let userBId: string;
let testDecisionId: string;

const timestamp = Date.now();
const emailA = `f13-user-a-${timestamp}@example.com`;
const emailB = `f13-user-b-${timestamp}@example.com`;
const password = 'Test123456!';

console.log('='.repeat(70));
console.log('Feature #13: Cannot access another user\'s decision by ID');
console.log('='.repeat(70));
console.log('');

/**
 * Step 1: Create User A
 */
async function step1_createUserA() {
  console.log('Step 1: Creating User A...');

  const { data: { user }, error } = await adminSupabase.auth.admin.createUser({
    email: emailA,
    password: password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create User A: ${error.message}`);
  }

  userAId = user!.id;
  console.log(`✅ User A created: ${emailA}`);
  console.log(`   User ID: ${userAId}`);
}

/**
 * Step 2: Create User B
 */
async function step2_createUserB() {
  console.log('');
  console.log('Step 2: Creating User B...');

  const { data: { user }, error } = await adminSupabase.auth.admin.createUser({
    email: emailB,
    password: password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create User B: ${error.message}`);
  }

  userBId = user!.id;
  console.log(`✅ User B created: ${emailB}`);
  console.log(`   User ID: ${userBId}`);
}

/**
 * Step 3: Get auth tokens for both users
 */
async function step3_getAuthTokens() {
  console.log('');
  console.log('Step 3: Getting auth tokens...');

  // Get token for User A
  const { data: dataA, error: errorA } = await adminSupabase.auth.signInWithPassword({
    email: emailA,
    password: password,
  });

  if (errorA) {
    throw new Error(`Failed to sign in User A: ${errorA.message}`);
  }

  userAToken = dataA.session.access_token;
  console.log(`✅ User A token obtained`);

  // Get token for User B
  const { data: dataB, error: errorB } = await adminSupabase.auth.signInWithPassword({
    email: emailB,
    password: password,
  });

  if (errorB) {
    throw new Error(`Failed to sign in User B: ${errorB.message}`);
  }

  userBToken = dataB.session.access_token;
  console.log(`✅ User B token obtained`);
}

/**
 * Step 4: Create a decision for User A
 */
async function step4_createDecisionForUserA() {
  console.log('');
  console.log('Step 4: Creating test decision for User A...');

  const response = await fetch(`${API_BASE}/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `F13 Security Test Decision - ${timestamp}`,
      category: 'testing',
      status: 'draft',
      notes: 'This decision should NOT be accessible by User B',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create decision: ${response.status} ${error}`);
  }

  const decision = await response.json();
  testDecisionId = decision.id;

  console.log(`✅ Decision created for User A`);
  console.log(`   Decision ID: ${testDecisionId}`);
  console.log(`   Title: ${decision.title}`);
  console.log(`   Owner: User A (${userAId})`);
}

/**
 * Step 5: Verify User A can access their own decision
 */
async function step5_verifyUserACanAccess() {
  console.log('');
  console.log('Step 5: Verifying User A can access their own decision...');

  const response = await fetch(`${API_BASE}/decisions/${testDecisionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userAToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`User A cannot access their own decision: ${response.status} ${error}`);
  }

  const decision = await response.json();

  console.log(`✅ User A can access their own decision`);
  console.log(`   Decision ID: ${decision.id}`);
  console.log(`   Title: ${decision.title}`);
  console.log(`   Status: ${response.status} OK`);

  // Verify the decision belongs to User A
  if (decision.user_id !== userAId) {
    throw new Error(`Decision user_id mismatch! Expected ${userAId}, got ${decision.user_id}`);
  }

  console.log(`   Verified: Decision belongs to User A`);
}

/**
 * Step 6: ATTEMPT: User B tries to access User A's decision (THIS SHOULD FAIL)
 */
async function step6_userBCannotAccessUserADecision() {
  console.log('');
  console.log('Step 6: Attempting to access User A\'s decision with User B\'s token...');
  console.log('⚠️  SECURITY TEST: This SHOULD FAIL with 404 Not Found');

  const response = await fetch(`${API_BASE}/decisions/${testDecisionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userBToken}`,
    },
  });

  console.log(`   Response Status: ${response.status} ${response.statusText}`);

  if (response.status === 404) {
    console.log('');
    console.log('✅ SECURITY CHECK PASSED: User B received 404 Not Found');
    console.log('   This is the EXPECTED behavior - users cannot access other users\' decisions');
    return true;
  }

  if (response.status === 200) {
    const decision = await response.json();
    console.log('');
    console.log('❌ SECURITY BREACH DETECTED!');
    console.log('   User B was able to access User A\'s decision!');
    console.log(`   Decision Title: ${decision.title}`);
    console.log(`   Decision Owner: ${decision.user_id}`);
    console.log(`   Accessed by: User B (${userBId})`);
    throw new Error('SECURITY VIOLATION: User B can access User A\'s decision!');
  }

  if (response.status === 401) {
    console.log('');
    console.log('⚠️  Received 401 Unauthorized instead of 404');
    console.log('   This still prevents access, but 404 is preferred');
    return true;
  }

  const error = await response.text();
  throw new Error(`Unexpected response: ${response.status} ${error}`);
}

/**
 * Step 7: Try to update User A's decision with User B's token (THIS SHOULD FAIL)
 */
async function step7_userBCannotUpdateUserADecision() {
  console.log('');
  console.log('Step 7: Attempting to UPDATE User A\'s decision with User B\'s token...');
  console.log('⚠️  SECURITY TEST: This SHOULD FAIL with 404 Not Found');

  const response = await fetch(`${API_BASE}/decisions/${testDecisionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${userBToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'HACKED - User B tried to change this',
    }),
  });

  console.log(`   Response Status: ${response.status} ${response.statusText}`);

  if (response.status === 404) {
    console.log('✅ SECURITY CHECK PASSED: Update blocked with 404');
    return true;
  }

  if (response.status === 200) {
    console.log('');
    console.log('❌ SECURITY BREACH DETECTED!');
    console.log('   User B was able to UPDATE User A\'s decision!');
    throw new Error('SECURITY VIOLATION: User B can update User A\'s decision!');
  }

  if (response.status === 401) {
    console.log('⚠️  Received 401 Unauthorized instead of 404');
    console.log('   This still prevents access, but 404 is preferred');
    return true;
  }

  const error = await response.text();
  throw new Error(`Unexpected response: ${response.status} ${error}`);
}

/**
 * Step 8: Try to delete User A's decision with User B's token (THIS SHOULD FAIL)
 */
async function step8_userBCannotDeleteUserADecision() {
  console.log('');
  console.log('Step 8: Attempting to DELETE User A\'s decision with User B\'s token...');
  console.log('⚠️  SECURITY TEST: This SHOULD FAIL');

  const response = await fetch(`${API_BASE}/decisions/${testDecisionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${userBToken}`,
    },
  });

  console.log(`   Response Status: ${response.status} ${response.statusText}`);

  if (response.status === 404 || response.status === 401) {
    console.log('✅ SECURITY CHECK PASSED: Delete blocked');
    return true;
  }

  if (response.status === 200 || response.status === 204) {
    console.log('');
    console.log('❌ SECURITY BREACH DETECTED!');
    console.log('   User B was able to DELETE User A\'s decision!');
    throw new Error('SECURITY VIOLATION: User B can delete User A\'s decision!');
  }

  // Some APIs don't implement DELETE, so 404 or 405 is acceptable
  if (response.status === 405) {
    console.log('ℹ️  DELETE method not implemented (405 Method Not Allowed)');
    console.log('   This is acceptable - the endpoint may not exist yet');
    return true;
  }

  const error = await response.text();
  console.log(`   Response: ${error}`);
  console.log('ℹ️  Non-success response - access blocked as expected');
  return true;
}

/**
 * Step 9: Verify User A's decision still exists and is unchanged
 */
async function step9_verifyDecisionUnchanged() {
  console.log('');
  console.log('Step 9: Verifying User A\'s decision is unchanged...');

  const response = await fetch(`${API_BASE}/decisions/${testDecisionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userAToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`User A cannot access their decision after attacks: ${response.status} ${error}`);
  }

  const decision = await response.json();

  console.log(`✅ User A's decision is intact`);
  console.log(`   Decision ID: ${decision.id}`);
  console.log(`   Title: ${decision.title}`);
  console.log(`   Status: ${decision.status}`);

  // Verify the title wasn't changed
  if (decision.title.includes('HACKED')) {
    throw new Error('Decision was modified by unauthorized user!');
  }

  console.log(`   Verified: Decision was not modified by User B`);
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('');
  console.log('='.repeat(70));
  console.log('Cleanup: Removing test data...');

  // Delete test decision
  const { error: deleteError } = await adminSupabase
    .from('decisions')
    .delete()
    .eq('id', testDecisionId);

  if (deleteError) {
    console.log(`⚠️  Could not delete test decision: ${deleteError.message}`);
  } else {
    console.log('✅ Test decision deleted');
  }

  // Delete test users
  const { error: deleteUserA } = await adminSupabase.auth.admin.deleteUser(userAId);
  const { error: deleteUserB } = await adminSupabase.auth.admin.deleteUser(userBId);

  if (deleteUserA) {
    console.log(`⚠️  Could not delete User A: ${deleteUserA.message}`);
  } else {
    console.log('✅ User A deleted');
  }

  if (deleteUserB) {
    console.log(`⚠️  Could not delete User B: ${deleteUserB.message}`);
  } else {
    console.log('✅ User B deleted');
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await step1_createUserA();
    await step2_createUserB();
    await step3_getAuthTokens();
    await step4_createDecisionForUserA();
    await step5_verifyUserACanAccess();
    await step6_userBCannotAccessUserADecision();
    await step7_userBCannotUpdateUserADecision();
    await step8_userBCannotDeleteUserADecision();
    await step9_verifyDecisionUnchanged();

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ ALL SECURITY TESTS PASSED');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log('  ✅ Users can only access their own decisions (GET)');
    console.log('  ✅ Users cannot update other users\' decisions (PATCH)');
    console.log('  ✅ Users cannot delete other users\' decisions (DELETE)');
    console.log('  ✅ ID manipulation attacks are blocked');
    console.log('  ✅ Data isolation between users is enforced');
    console.log('');
    console.log('Feature #13: PASSING ✅');

  } catch (error: any) {
    console.log('');
    console.log('='.repeat(70));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Error: ${error.message}`);
    console.log('');
    console.log('Feature #13: FAILING ❌');
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run the tests
runTests();
