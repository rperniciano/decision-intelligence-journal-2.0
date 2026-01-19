const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_URL = 'http://localhost:4011';
const TEST_USER_EMAIL = 'feature267@test.com';
const TEST_USER_PASSWORD = 'test123456';

async function getAuthToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error) throw error;
  return data.session.access_token;
}

async function createDecision(token, title) {
  const response = await fetch(`${API_URL}/api/v1/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      category: 'Career',
      status: 'decided',
      options: [
        { text: 'Option A', isChosen: false },
        { text: 'Option B', isChosen: true },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create decision: ${response.statusText}`);
  }

  return response.json();
}

async function getDecisions(token, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const response = await fetch(
    `${API_URL}/api/v1/decisions?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch decisions: ${response.statusText}`);
  }

  return response.json();
}

async function testPaginationConsistency() {
  console.log('=== Feature #267: Pagination Consistency Test ===\n');

  // 1. Get auth token
  console.log('1. Getting auth token...');
  const token = await getAuthToken();
  console.log('   ✓ Auth token obtained\n');

  // Get user ID from auth response
  const { data: { user } } = await supabase.auth.getUser(token);
  const userId = user?.id || '7799a9ba-676e-4691-89fe-a06eae643f5a';

  // 2. Create 25 decisions (3 pages worth)
  console.log('2. Creating 25 test decisions...');
  const { data: existingDecisions, error } = await supabase
    .from('decisions')
    .select('id')
    .eq('user_id', userId);

  if (existingDecisions && existingDecisions.length >= 25) {
    console.log(`   ✓ Already have ${existingDecisions.length} decisions\n`);
  } else {
    const needed = 25 - (existingDecisions?.length || 0);
    for (let i = 0; i < needed; i++) {
      await createDecision(token, `Test Decision ${i + 1} - ${Date.now()}`);
    }
    console.log(`   ✓ Created ${needed} new decisions\n`);
  }

  // 3. Fetch page 1 - should have 10 items
  console.log('3. Fetching Page 1...');
  const page1 = await getDecisions(token, 1, 10);
  console.log(`   ✓ Page 1: ${page1.decisions.length} decisions`);
  console.log(`   ✓ Total count: ${page1.total}`);
  console.log('   First 3 titles:', page1.decisions.slice(0, 3).map(d => d.title).join(', '));

  // Store the IDs on page 1
  const page1Ids = new Set(page1.decisions.map(d => d.id));
  console.log('   ✓ Stored', page1Ids.size, 'IDs from page 1\n');

  // 4. Fetch page 2 - should have 10 items
  console.log('4. Fetching Page 2...');
  const page2 = await getDecisions(token, 2, 10);
  console.log(`   ✓ Page 2: ${page2.decisions.length} decisions`);
  console.log('   First 3 titles:', page2.decisions.slice(0, 3).map(d => d.title).join(', '));

  // Store the IDs on page 2
  const page2Ids = new Set(page2.decisions.map(d => d.id));
  console.log('   ✓ Stored', page2Ids.size, 'IDs from page 2\n');

  // 5. Verify no overlap between pages
  console.log('5. Checking for overlap between pages...');
  const overlap = [...page1Ids].filter(id => page2Ids.has(id));
  if (overlap.length > 0) {
    console.log('   ✗ ERROR: Found', overlap.length, 'duplicate IDs across pages:', overlap);
  } else {
    console.log('   ✓ No duplicates found between page 1 and page 2\n');
  }

  // 6. Simulate another user adding a new decision
  console.log('6. Simulating another user adding a new decision...');
  const newDecision = await createDecision(token, `NEW Decision - ${Date.now()}`);
  console.log(`   ✓ Created new decision: ${newDecision.title} (ID: ${newDecision.id})\n`);

  // 7. Fetch page 1 again - should now have the new decision
  console.log('7. Fetching Page 1 again (after new decision added)...');
  const page1After = await getDecisions(token, 1, 10);
  console.log(`   ✓ Page 1: ${page1After.decisions.length} decisions`);
  console.log('   First 3 titles:', page1After.decisions.slice(0, 3).map(d => d.title).join(', '));

  // Check if new decision is on page 1
  const newDecisionOnPage1 = page1After.decisions.find(d => d.id === newDecision.id);
  if (newDecisionOnPage1) {
    console.log(`   ✓ New decision "${newDecision.title}" is on page 1\n`);
  } else {
    console.log(`   ⚠ New decision is NOT on page 1 (expected if sorted by created_at DESC)\n`);
  }

  // 8. Fetch page 2 again - check if pagination is still consistent
  console.log('8. Fetching Page 2 again (critical test)...');
  const page2After = await getDecisions(token, 2, 10);
  console.log(`   ✓ Page 2: ${page2After.decisions.length} decisions`);
  console.log('   First 3 titles:', page2After.decisions.slice(0, 3).map(d => d.title).join(', '));

  const page2AfterIds = new Set(page2After.decisions.map(d => d.id));

  // Check if the SAME decisions are still on page 2
  const missingFromPage2 = [...page2Ids].filter(id => !page2AfterIds.has(id));
  const newOnPage2 = [...page2AfterIds].filter(id => !page2Ids.has(id));

  if (missingFromPage2.length > 0) {
    console.log(`   ✗ ERROR: ${missingFromPage2.length} decisions disappeared from page 2!`);
    console.log('      Missing IDs:', missingFromPage2);
  } else {
    console.log('   ✓ All original page 2 decisions are still on page 2');
  }

  if (newOnPage2.length > 0) {
    console.log(`   ⚠ ${newOnPage2.length} new decisions appeared on page 2`);
    console.log('      New IDs:', newOnPage2);
  } else {
    console.log('   ✓ No unexpected new decisions on page 2\n');
  }

  // 9. Verify total count increased
  console.log('9. Verifying total count...');
  if (page1After.total === page1.total + 1) {
    console.log(`   ✓ Total count increased from ${page1.total} to ${page1After.total}\n`);
  } else {
    console.log(`   ✗ Total count mismatch: was ${page1.total}, now ${page1After.total}\n`);
  }

  console.log('=== Test Complete ===\n');
  console.log('Summary:');
  console.log('- Original page 1 had:', page1Ids.size, 'decisions');
  console.log('- Original page 2 had:', page2Ids.size, 'decisions');
  console.log('- After adding 1 new decision:');
  console.log('  - Page 1 now has:', page1After.decisions.length, 'decisions');
  console.log('  - Page 2 now has:', page2After.decisions.length, 'decisions');
  console.log('  - Total count:', page1After.total);
}

testPaginationConsistency()
  .then(() => console.log('\n✓ Test completed successfully'))
  .catch(err => console.error('\n✗ Test failed:', err));
