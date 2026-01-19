const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_URL = 'http://localhost:4013';
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

async function getDecisions(token, cursor = null, limit = 10) {
  const url = cursor
    ? `${API_URL}/api/v1/decisions?limit=${limit}&cursor=${encodeURIComponent(cursor)}`
    : `${API_URL}/api/v1/decisions?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch decisions: ${response.statusText}`);
  }

  return response.json();
}

async function testCursorPagination() {
  console.log('=== Feature #267: Cursor-Based Pagination Test ===\n');

  // 1. Get auth token
  console.log('1. Getting auth token...');
  const token = await getAuthToken();
  console.log('   ✓ Auth token obtained\n');

  // 2. Fetch page 1 (no cursor)
  console.log('2. Fetching Page 1 (no cursor)...');
  const page1 = await getDecisions(token, null, 10);
  console.log(`   ✓ Page 1: ${page1.decisions.length} decisions`);
  console.log(`   ✓ Total count: ${page1.total}`);
  console.log(`   ✓ Next cursor: ${page1.nextCursor ? 'YES' : 'NO'}`);
  console.log(`   ✓ Has more: ${page1.hasMore}`);
  console.log('   First 3 titles:', page1.decisions.slice(0, 3).map(d => d.title).join(', '));

  const page1Ids = new Set(page1.decisions.map(d => d.id));
  console.log('   ✓ Stored', page1Ids.size, 'IDs from page 1\n');

  if (!page1.nextCursor) {
    console.log('   ⚠ No nextCursor returned - cursor pagination not working\n');
    return;
  }

  // 3. Fetch page 2 (using cursor from page 1)
  console.log('3. Fetching Page 2 (using cursor)...');
  console.log(`   Cursor: ${page1.nextCursor}`);
  const page2 = await getDecisions(token, page1.nextCursor, 10);
  console.log(`   ✓ Page 2: ${page2.decisions.length} decisions`);
  console.log('   First 3 titles:', page2.decisions.slice(0, 3).map(d => d.title).join(', '));

  const page2Ids = new Set(page2.decisions.map(d => d.id));
  console.log('   ✓ Stored', page2Ids.size, 'IDs from page 2\n');

  // 4. Verify no overlap
  console.log('4. Checking for overlap between pages...');
  const overlap = [...page1Ids].filter(id => page2Ids.has(id));
  if (overlap.length > 0) {
    console.log('   ✗ ERROR: Found', overlap.length, 'duplicate IDs across pages!');
  } else {
    console.log('   ✓ No duplicates found\n');
  }

  // 5. Simulate new decision added
  console.log('5. Simulating another user adding a new decision...');
  const createResponse = await fetch(`${API_URL}/api/v1/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `NEW Decision - ${Date.now()}`,
      category: 'Career',
      status: 'decided',
      options: [
        { text: 'Option A', isChosen: false },
        { text: 'Option B', isChosen: true },
      ],
    }),
  });

  if (!createResponse.ok) {
    console.log('   ✗ Failed to create new decision');
  } else {
    const newDecision = await createResponse.json();
    console.log(`   ✓ Created new decision: ${newDecision.title} (ID: ${newDecision.id})\n`);
  }

  // 6. Fetch page 1 again
  console.log('6. Fetching Page 1 again (after new decision added)...');
  const page1After = await getDecisions(token, null, 10);
  console.log(`   ✓ Page 1: ${page1After.decisions.length} decisions`);
  console.log('   First 3 titles:', page1After.decisions.slice(0, 3).map(d => d.title).join(', '));
  console.log(`   ✓ Next cursor: ${page1After.nextCursor ? 'YES' : 'NO'}\n`);

  // 7. Fetch page 2 again using THE ORIGINAL cursor (this is the key test!)
  console.log('7. Fetching Page 2 again using ORIGINAL cursor (critical test)...');
  const page2After = await getDecisions(token, page1.nextCursor, 10);
  console.log(`   ✓ Page 2: ${page2After.decisions.length} decisions`);
  console.log('   First 3 titles:', page2After.decisions.slice(0, 3).map(d => d.title).join(', '));

  const page2AfterIds = new Set(page2After.decisions.map(d => d.id));

  // Check if the SAME decisions are still on page 2
  const missingFromPage2 = [...page2Ids].filter(id => !page2AfterIds.has(id));
  const newOnPage2 = [...page2AfterIds].filter(id => !page2Ids.has(id));

  console.log('\n8. Verifying page 2 stability...');
  if (missingFromPage2.length === 0 && newOnPage2.length === 0) {
    console.log('   ✓ SUCCESS: Page 2 is stable! No items disappeared or appeared.');
    console.log('   ✓ Cursor-based pagination is working correctly!\n');
  } else {
    if (missingFromPage2.length > 0) {
      console.log(`   ✗ ERROR: ${missingFromPage2.length} decisions disappeared from page 2!`);
      console.log('      Missing IDs:', missingFromPage2);
    }
    if (newOnPage2.length > 0) {
      console.log(`   ⚠ ${newOnPage2.length} new decisions appeared on page 2`);
      console.log('      New IDs:', newOnPage2);
    }
    console.log();
  }

  console.log('=== Test Complete ===\n');
  console.log('Summary:');
  console.log('- Original page 1 had:', page1Ids.size, 'decisions');
  console.log('- Original page 2 had:', page2Ids.size, 'decisions');
  console.log('- After adding 1 new decision:');
  console.log('  - Page 1 now has:', page1After.decisions.length, 'decisions');
  console.log('  - Page 2 (using original cursor) has:', page2After.decisions.length, 'decisions');
  console.log('  - Page 2 stable:', missingFromPage2.length === 0 && newOnPage2.length === 0 ? 'YES ✓' : 'NO ✗');
}

testCursorPagination()
  .then(() => console.log('\n✓ Test completed successfully'))
  .catch(err => console.error('\n✗ Test failed:', err));
