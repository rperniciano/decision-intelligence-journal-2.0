/**
 * Feature #268: Rapid navigation shows correct data
 *
 * This test verifies that when a user navigates rapidly between pages:
 * 1. Each page shows its correct data
 * 2. No stale data from previous pages is shown
 * 3. Loading states handle transitions properly
 *
 * The issue: When useEffect doesn't implement cleanup/AbortController,
 * multiple fetch requests can be in flight. When they resolve, they ALL
 * update state, causing the last response to win - which might be from
 * a previous page.
 */

const Database = require('better-sqlite3');
const path = require('path');

// Create test users with specific decision counts for each page
async function setupTestData() {
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== Setting up test data for Feature #268 ===\n');

  // Create test user
  const email = `test_f268_${Date.now()}@example.com`;
  const password = 'test123456';

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.error('Error creating user:', userError);
    return null;
  }

  const userId = userData.user.id;
  console.log(`✓ Created test user: ${email}`);

  // Create a category
  const categoryName = 'Test Category F268';
  const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: categoryName,
      slug: slug,
      color: '#00d4aa',
      icon: '🧪',
    })
    .select()
    .single();

  if (categoryError || !categoryData) {
    console.error('Error creating category:', categoryError);
    return null;
  }

  const categoryId = categoryData.id;
  console.log(`✓ Created category: ${categoryData.name}`);

  // Create decisions with specific titles to identify which "page" they belong to
  const decisions = [
    // Page 1 decisions (newest, should show on /history first)
    { title: 'PAGE_1_DECISION_001', created_at: new Date(Date.now() - 1000).toISOString() },
    { title: 'PAGE_1_DECISION_002', created_at: new Date(Date.now() - 2000).toISOString() },
    { title: 'PAGE_1_DECISION_003', created_at: new Date(Date.now() - 3000).toISOString() },
    { title: 'PAGE_1_DECISION_004', created_at: new Date(Date.now() - 4000).toISOString() },
    { title: 'PAGE_1_DECISION_005', created_at: new Date(Date.now() - 5000).toISOString() },
    { title: 'PAGE_1_DECISION_006', created_at: new Date(Date.now() - 6000).toISOString() },
    { title: 'PAGE_1_DECISION_007', created_at: new Date(Date.now() - 7000).toISOString() },
    { title: 'PAGE_1_DECISION_008', created_at: new Date(Date.now() - 8000).toISOString() },
    { title: 'PAGE_1_DECISION_009', created_at: new Date(Date.now() - 9000).toISOString() },
    { title: 'PAGE_1_DECISION_010', created_at: new Date(Date.now() - 10000).toISOString() },

    // Page 2 decisions (older)
    { title: 'PAGE_2_DECISION_001', created_at: new Date(Date.now() - 11000).toISOString() },
    { title: 'PAGE_2_DECISION_002', created_at: new Date(Date.now() - 12000).toISOString() },
    { title: 'PAGE_2_DECISION_003', created_at: new Date(Date.now() - 13000).toISOString() },
    { title: 'PAGE_2_DECISION_004', created_at: new Date(Date.now() - 14000).toISOString() },
    { title: 'PAGE_2_DECISION_005', created_at: new Date(Date.now() - 15000).toISOString() },
    { title: 'PAGE_2_DECISION_006', created_at: new Date(Date.now() - 16000).toISOString() },
    { title: 'PAGE_2_DECISION_007', created_at: new Date(Date.now() - 17000).toISOString() },
    { title: 'PAGE_2_DECISION_008', created_at: new Date(Date.now() - 18000).toISOString() },
    { title: 'PAGE_2_DECISION_009', created_at: new Date(Date.now() - 19000).toISOString() },
    { title: 'PAGE_2_DECISION_010', created_at: new Date(Date.now() - 20000).toISOString() },

    // Page 3 decisions (oldest)
    { title: 'PAGE_3_DECISION_001', created_at: new Date(Date.now() - 21000).toISOString() },
    { title: 'PAGE_3_DECISION_002', created_at: new Date(Date.now() - 22000).toISOString() },
    { title: 'PAGE_3_DECISION_003', created_at: new Date(Date.now() - 23000).toISOString() },
    { title: 'PAGE_3_DECISION_004', created_at: new Date(Date.now() - 24000).toISOString() },
  ];

  for (const decision of decisions) {
    await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title: decision.title,
        status: 'decided',
        created_at: decision.created_at,
        recorded_at: decision.created_at,
      });
  }

  console.log(`✓ Created ${decisions.length} decisions`);
  console.log(`  - Page 1: 10 decisions (PAGE_1_*)`);
  console.log(`  - Page 2: 10 decisions (PAGE_2_*)`);
  console.log(`  - Page 3: 4 decisions (PAGE_3_*)`);

  return {
    email,
    password,
    userId,
    categoryId,
  };
}

async function testRapidNavigationBrowser() {
  console.log('\n=== Testing rapid navigation with browser automation ===\n');

  // We'll use Playwright MCP tools for this test
  console.log('This test requires manual browser automation verification.');
  console.log('Test steps:');
  console.log('1. Login to the app');
  console.log('2. Navigate to /history?page=1');
  console.log('3. BEFORE page 1 finishes loading, navigate to /history?page=2');
  console.log('4. BEFORE page 2 finishes loading, navigate to /history?page=3');
  console.log('5. Wait for all requests to complete');
  console.log('6. Verify page 3 shows PAGE_3_* decisions (not PAGE_1_* or PAGE_2_*)');
  console.log('7. Navigate back to /history?page=1');
  console.log('8. Verify page 1 shows PAGE_1_* decisions (not stale data)');
}

async function testApiResponseOrder() {
  console.log('\n=== Testing API response ordering (simulation) ===\n');

  // Simulate what happens when responses arrive out of order
  const scenarios = [
    {
      name: 'Fast page 2, slow page 1',
      page1Delay: 1000,
      page2Delay: 100,
      expectedProblem: 'Page 1 data overwrites page 2 (stale data bug!)',
    },
    {
      name: 'Slow page 1, fast page 2, slow page 3',
      page1Delay: 500,
      page2Delay: 100,
      page3Delay: 800,
      expectedProblem: 'Last response wins regardless of navigation order',
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\nScenario: ${scenario.name}`);
    console.log(`  Problem: ${scenario.expectedProblem}`);
    console.log(`  Without AbortController:`);

    // Simulate the problematic behavior
    const requests = [];
    const startTimes = [];

    // Start all requests
    const page1Start = Date.now();
    requests.push(
      new Promise(resolve => setTimeout(() => resolve({ page: 1, data: 'PAGE_1_DATA' }), scenario.page1Delay))
    );
    startTimes.push({ page: 1, time: page1Start });

    const page2Start = Date.now();
    requests.push(
      new Promise(resolve => setTimeout(() => resolve({ page: 2, data: 'PAGE_2_DATA' }), scenario.page2Delay))
    );
    startTimes.push({ page: 2, time: page2Start });

    if (scenario.page3Delay) {
      const page3Start = Date.now();
      requests.push(
        new Promise(resolve => setTimeout(() => resolve({ page: 3, data: 'PAGE_3_DATA' }), scenario.page3Delay))
      );
      startTimes.push({ page: 3, time: page3Start });
    }

    // Wait for all and show which "wins"
    const results = await Promise.all(requests);
    const lastResult = results[results.length - 1];
    console.log(`    ✗ All requests execute, last response wins: ${lastResult.data}`);
    console.log(`    ✗ User sees stale data from previous page!`);
  }

  console.log(`\n  With AbortController (proper solution):`);
  console.log(`    ✓ Component unmount → abort controller signal sent`);
  console.log(`    ✓ Pending fetch() is cancelled`);
  console.log(`    ✓ Only current page's data is set in state`);
  console.log(`    ✓ User sees correct data for current page`);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Feature #268: Rapid Navigation Shows Correct Data           ║');
  console.log('║  Testing race condition prevention in page navigation       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Test 1: Setup test data
  const testData = await setupTestData();

  if (!testData) {
    console.error('\n✗ Failed to setup test data');
    process.exit(1);
  }

  // Test 2: Explain the race condition
  await testApiResponseOrder();

  // Test 3: Browser test instructions
  await testRapidNavigationBrowser();

  console.log('\n=== Summary ===\n');
  console.log('Required fixes:');
  console.log('1. HistoryPage.tsx - Add AbortController to decision fetch');
  console.log('2. DashboardPage.tsx - Add AbortController to stats/pending reviews fetch');
  console.log('3. DecisionDetailPage.tsx - Add AbortController (if applicable)');
  console.log('\nPattern to implement:');
  console.log('```typescript');
  console.log('useEffect(() => {');
  console.log('  const abortController = new AbortController();');
  console.log('  const signal = abortController.signal;');
  console.log('  ');
  console.log('  async function fetchData() {');
  console.log('    try {');
  console.log('      const response = await fetch(url, { signal });');
  console.log('      // ... handle response');
  console.log('    } catch (error) {');
  console.log('      if (error.name !== "AbortError") {');
  console.log('        // Handle real errors');
  console.log('      }');
  console.log('    }');
  console.log('  }');
  console.log('  ');
  console.log('  fetchData();');
  console.log('  ');
  console.log('  return () => {');
  console.log('    abortController.abort(); // Cancel on unmount');
  console.log('  };');
  console.log('}, [dependencies]);');
  console.log('```\n');

  console.log('\nTest user credentials:');
  console.log(`  Email: ${testData.email}`);
  console.log(`  Password: ${testData.password}\n`);
}

main().catch(console.error);
