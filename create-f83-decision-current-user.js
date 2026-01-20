/**
 * Create test decision with options for the currently logged-in user
 * This script uses the API to create a decision after logging in
 */

const testEmail = 'f258-overdue-test-1768928501646@example.com';
const testPassword = 'test123456';

async function getAuthToken() {
  // Get auth token by logging in through the API
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

async function createDecisionWithOPT(token) {
  const decisionData = {
    title: 'F83_TEST_DECISION_OPTIONS',
    description: 'Test decision for Feature #83 - option editing workflow',
    status: 'draft'
  };

  const response = await fetch('http://localhost:3001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(decisionData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create decision: ${response.statusText}`);
  }

  const decision = await response.json();
  console.log('✅ Created decision:', decision.id);

  // Create options
  const options = [
    { title: 'Option A - Keep Original', description: 'This option should remain unchanged' },
    { title: 'Option B - Modified Choice', description: 'This option will be renamed' },
    { title: 'Option C - To Be Deleted', description: 'This option will be removed' },
    { title: 'Option D - Neutral Ground', description: 'This option should remain unchanged' }
  ];

  for (const opt of options) {
    const optResponse = await fetch(`http://localhost:3001/api/v1/decisions/${decision.id}/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(opt)
    });

    if (optResponse.ok) {
      console.log(`  ✅ Created option: ${opt.title}`);
    } else {
      console.error(`  ❌ Failed to create option "${opt.title}": ${optResponse.statusText}`);
    }
  }

  console.log('\n========================================');
  console.log('TEST DATA READY FOR FEATURE #83');
  console.log('========================================');
  console.log(`Decision ID: ${decision.id}`);
  console.log(`Title: F83_TEST_DECISION_OPTIONS`);
  console.log(`Options: ${options.length}`);
  console.log('\nTest Plan:');
  console.log('  1. Navigate to decision detail page');
  console.log('  2. Click Edit button');
  console.log('  3. Rename "Option B - Modified Choice" → "Option B - RENAMED"');
  console.log('  4. Add new option "Option E - New Addition"');
  console.log('  5. Delete "Option C - To Be Deleted"');
  console.log('  6. Save changes');
  console.log('  7. Verify all changes persisted');
  console.log('========================================\n');

  console.log(`✅ Ready for browser testing!`);
  console.log(`   URL: http://localhost:5196/decisions/${decision.id}\n`);

  return decision.id;
}

async function main() {
  try {
    console.log('Logging in...\n');
    const token = await getAuthToken();
    console.log('✅ Logged in successfully\n');

    const decisionId = await createDecisionWithOPT(token);
    console.log(`\n✅ Test data created successfully! Decision ID: ${decisionId}\n`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
