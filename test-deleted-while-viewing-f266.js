// Test Feature #266: Record deleted while viewing handled gracefully
// This script tests the backend API responses when a decision is deleted

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:4011/api/v1';

// Test credentials
const TEST_USER = {
  email: 'feature266@test.com',
  password: 'test123456'
};

let authToken = null;
let testDecisionId = null;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Login to get auth token
async function login() {
  console.log('\n=== 1. Logging in as test user ===');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  authToken = data.session.access_token;
  console.log('✓ Login successful');
  return authToken;
}

// Create a test decision
async function createDecision() {
  console.log('\n=== 2. Creating test decision ===');

  const response = await fetch(`${API_URL}/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'F266 Test Decision - Deleted While Viewing',
      status: 'decided',
      options: [
        {
          text: 'Option A',
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1'],
          isChosen: true
        },
        {
          text: 'Option B',
          pros: ['Pro 1'],
          cons: ['Con 1', 'Con 2']
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create decision failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  testDecisionId = data.id;
  console.log(`✓ Test decision created: ${testDecisionId}`);
  return testDecisionId;
}

// Test 1: Fetch decision (should work)
async function testFetchDecision() {
  console.log('\n=== 3. Test: Fetch decision (should work) ===');

  const response = await fetch(`${API_URL}/decisions/${testDecisionId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  console.log(`Status: ${response.status}`);

  if (response.ok) {
    const data = await response.json();
    console.log(`✓ Decision fetched successfully: ${data.title}`);
    return true;
  } else {
    console.log(`✗ Failed to fetch decision`);
    return false;
  }
}

// Test 2: Delete the decision
async function testDeleteDecision() {
  console.log('\n=== 4. Test: Delete decision ===');

  const response = await fetch(`${API_URL}/decisions/${testDecisionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  console.log(`Status: ${response.status}`);

  if (response.ok) {
    console.log(`✓ Decision deleted successfully`);
    return true;
  } else {
    console.log(`✗ Failed to delete decision`);
    return false;
  }
}

// Test 3: Try to fetch deleted decision (should get 404 since decision is not found)
async function testFetchDeletedDecision() {
  console.log('\n=== 5. Test: Fetch deleted decision (expect 404 or 410) ===');

  const response = await fetch(`${API_URL}/decisions/${testDecisionId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  console.log(`Status: ${response.status}`);

  if (response.status === 410) {
    const data = await response.json();
    console.log(`✓ Got expected 410 Gone response`);
    console.log(`  Message: ${data.message}`);
    console.log(`  Can Redirect: ${data.canRedirect}`);
    return true;
  } else if (response.status === 404) {
    console.log(`✓ Got 404 Not Found (acceptable)`);
    return true;
  } else {
    console.log(`✗ Unexpected status code: ${response.status}`);
    return false;
  }
}

// Test 4: Try to update deleted decision (should get 410)
async function testUpdateDeletedDecision() {
  console.log('\n=== 6. Test: Update deleted decision (expect 410 Gone) ===');

  const response = await fetch(`${API_URL}/decisions/${testDecisionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Trying to update deleted decision'
    })
  });

  console.log(`Status: ${response.status}`);

  if (response.status === 410) {
    const data = await response.json();
    console.log(`✓ Got expected 410 Gone response`);
    console.log(`  Message: ${data.message}`);
    console.log(`  Can Redirect: ${data.canRedirect}`);
    return true;
  } else if (response.status === 404) {
    console.log(`✓ Got 404 Not Found (acceptable)`);
    return true;
  } else {
    console.log(`✗ Unexpected status code: ${response.status}`);
    const data = await response.json().catch(() => ({}));
    console.log(`  Error: ${data.error || data.message || 'Unknown'}`);
    return false;
  }
}

// Test 5: Try to record outcome on deleted decision (should get 410)
async function testRecordOutcomeOnDeletedDecision() {
  console.log('\n=== 7. Test: Record outcome on deleted decision (expect 410 Gone) ===');

  const response = await fetch(`${API_URL}/decisions/${testDecisionId}/outcomes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      result: 'positive',
      satisfaction: 5,
      notes: 'Trying to record outcome on deleted decision'
    })
  });

  console.log(`Status: ${response.status}`);

  if (response.status === 410) {
    const data = await response.json();
    console.log(`✓ Got expected 410 Gone response`);
    console.log(`  Message: ${data.message}`);
    console.log(`  Can Redirect: ${data.canRedirect}`);
    return true;
  } else if (response.status === 404) {
    console.log(`✓ Got 404 Not Found (acceptable)`);
    return true;
  } else {
    console.log(`✗ Unexpected status code: ${response.status}`);
    const data = await response.json().catch(() => ({}));
    console.log(`  Error: ${data.error || data.message || 'Unknown'}`);
    return false;
  }
}

// Test 6: Try to set reminder on deleted decision (should get 410)
async function testSetReminderOnDeletedDecision() {
  console.log('\n=== 8. Test: Set reminder on deleted decision (expect 410 Gone) ===');

  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + 7);

  const response = await fetch(`${API_URL}/decisions/${testDecisionId}/reminders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      remind_at: reminderDate.toISOString(),
      timezone: 'UTC'
    })
  });

  console.log(`Status: ${response.status}`);

  if (response.status === 410) {
    const data = await response.json();
    console.log(`✓ Got expected 410 Gone response`);
    console.log(`  Message: ${data.message}`);
    console.log(`  Can Redirect: ${data.canRedirect}`);
    return true;
  } else if (response.status === 404) {
    console.log(`✓ Got 404 Not Found (acceptable)`);
    return true;
  } else {
    console.log(`✗ Unexpected status code: ${response.status}`);
    const data = await response.json().catch(() => ({}));
    console.log(`  Error: ${data.error || data.message || 'Unknown'}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('Feature #266: Record deleted while viewing handled gracefully');
    console.log('Backend API Tests');
    console.log('='.repeat(70));

    await login();
    await createDecision();

    const results = [];

    results.push({ name: 'Fetch decision (before delete)', passed: await testFetchDecision() });
    results.push({ name: 'Delete decision', passed: await testDeleteDecision() });
    results.push({ name: 'Fetch deleted decision', passed: await testFetchDeletedDecision() });
    results.push({ name: 'Update deleted decision', passed: await testUpdateDeletedDecision() });
    results.push({ name: 'Record outcome on deleted decision', passed: await testRecordOutcomeOnDeletedDecision() });
    results.push({ name: 'Set reminder on deleted decision', passed: await testSetReminderOnDeletedDecision() });

    console.log('\n' + '='.repeat(70));
    console.log('Test Results Summary');
    console.log('='.repeat(70));

    results.forEach(result => {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${status}: ${result.name}`);
    });

    const allPassed = results.every(r => r.passed);
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      console.log('✓ ALL TESTS PASSED');
    } else {
      console.log('✗ SOME TESTS FAILED');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n✗ Test execution failed:', error.message);
    console.error(error.stack);
  }
}

runTests();
