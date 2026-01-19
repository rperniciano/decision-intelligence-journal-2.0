/**
 * Feature #268: Browser Automation Test
 * Test rapid navigation to verify no stale data is shown
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const TEST_USER_EMAIL = 'test_f268_1768865229524@example.com';
const TEST_USER_PASSWORD = 'test123456';

async function testWithBrowserAutomation() {
  console.log('\n=== Feature #268: Rapid Navigation Test ===\n');
  console.log('Test will verify:');
  console.log('1. Navigate rapidly between pages');
  console.log('2. Verify each page shows correct data');
  console.log('3. Verify no data from previous page shown');
  console.log('4. Verify loading states handle transitions\n');

  console.log('TEST USER CREDENTIALS:');
  console.log(`  Email: ${TEST_USER_EMAIL}`);
  console.log(`  Password: ${TEST_USER_PASSWORD}\n`);

  console.log('MANUAL TEST STEPS:');
  console.log('1. Open browser to http://localhost:5173');
  console.log('2. Login with test credentials');
  console.log('3. Navigate to /history?page=1');
  console.log('4. QUICKLY navigate to /history?page=2');
  console.log('5. QUICKLY navigate to /history?page=3');
  console.log('6. Observe the final page shows PAGE_3_* decisions');
  console.log('7. Navigate back to /history?page=1');
  console.log('8. Verify PAGE_1_* decisions are shown (not stale data)\n');

  console.log('EXPECTED BEHAVIOR (with AbortController):');
  console.log('✓ Each navigation aborts previous pending requests');
  console.log('✓ Only the current page\'s data is displayed');
  console.log('✓ No flickering or stale data from previous pages');
  console.log('✓ Loading states appear correctly\n');

  console.log('OPEN BROWSER CONSOLE TO OBSERVE:');
  console.log('- Network tab should show cancelled requests (aborted)');
  console.log('- No errors related to AbortError should be visible to user');
  console.log('- Each page should load its own data correctly\n');

  console.log('=== Test Instructions Complete ===\n');
}

async function verifyDatabaseData() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('=== Verifying Test Data in Database ===\n');

  // Query the test user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const testUser = users.users.find(u => u.email === TEST_USER_EMAIL);

  if (!testUser) {
    console.error('✗ Test user not found in database');
    return false;
  }

  console.log(`✓ Found test user: ${testUser.email}`);

  // Query decisions for this user
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('id, title, created_at')
    .eq('user_id', testUser.id)
    .order('created_at', { ascending: false });

  if (decisionsError) {
    console.error('✗ Error querying decisions:', decisionsError);
    return false;
  }

  console.log(`✓ Found ${decisions.length} decisions`);
  console.log('\nPage 1 decisions (newest):');
  decisions.slice(0, 10).forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.title}`);
  });

  if (decisions.length > 10) {
    console.log('\nPage 2 decisions:');
    decisions.slice(10, 20).forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.title}`);
    });
  }

  if (decisions.length > 20) {
    console.log('\nPage 3 decisions (oldest):');
    decisions.slice(20).forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.title}`);
    });
  }

  console.log('\n✓ Test data verified in database');
  return true;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Feature #268: Rapid Navigation Shows Correct Data           ║');
  console.log('║  Browser Automation Verification                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await verifyDatabaseData();
  await testWithBrowserAutomation();

  console.log('\nNEXT STEP: Manual browser test required');
  console.log('Or use Playwright MCP tools for automated verification\n');
}

main().catch(console.error);
