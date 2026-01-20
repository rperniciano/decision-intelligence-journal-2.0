/**
 * Feature #18: Successful login redirects to intended destination
 *
 * Test steps:
 * 1. Navigate to a protected page (e.g., /decisions/new)
 * 2. Verify redirect to login page
 * 3. Login with valid credentials
 * 4. Verify redirect back to original protected page
 * 5. Verify session is established
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  // Clean up test user if exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'feature18-test@example.com');
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id);
    console.log('✓ Cleaned up existing test user');
  }
}

async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'feature18-test@example.com',
    password: 'TestPass123!',
    email_confirm: true
  });

  if (error) {
    throw error;
  }

  console.log('✓ Created test user: feature18-test@example.com');
  return data.user;
}

async function testFeature18() {
  console.log('\n=== Feature #18: Successful login redirects to intended destination ===\n');

  let browser, context, page;

  try {
    // Step 0: Setup
    await cleanup();
    const user = await createTestUser();

    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();

    // Step 1: Navigate to protected page
    console.log('Step 1: Navigate to protected page /decisions/new');
    await page.goto('http://localhost:5173/decisions/new');
    await page.waitForLoadState('networkidle');

    // Verify redirect to login
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/login')) {
      throw new Error('❌ Did not redirect to login page');
    }
    console.log('  ✓ Redirected to login page');

    // Step 2: Login with valid credentials
    console.log('\nStep 2: Login with valid credentials');
    await page.fill('input[name="email"], input[type="email"]', 'feature18-test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Step 3: Verify redirect back to original page
    console.log('\nStep 3: Verify redirect back to /decisions/new');
    const finalUrl = page.url();
    console.log(`  Final URL: ${finalUrl}`);

    if (!finalUrl.includes('/decisions/new')) {
      throw new Error(`❌ Did not redirect to /decisions/new, instead at: ${finalUrl}`);
    }
    console.log('  ✓ Redirected to original protected page');

    // Step 4: Verify session is established
    console.log('\nStep 4: Verify session is established');
    const hasSession = await page.evaluate(() => {
      const sessionStorage = window.sessionStorage;
      return sessionStorage.getItem('supabase.auth.token') !== null ||
             localStorage.getItem('supabase.auth.token') !== null;
    });

    if (!hasSession) {
      // Check if authenticated by trying to access protected API
      try {
        const response = await page.evaluate(async () => {
          const res = await fetch('http://localhost:5173/api/v1/user');
          return res.ok;
        });
        if (response) {
          console.log('  ✓ Session established (API access confirmed)');
        } else {
          throw new Error('❌ No active session detected');
        }
      } catch (e) {
        throw new Error('❌ Cannot verify session: ' + e.message);
      }
    } else {
      console.log('  ✓ Session established');
    }

    // Take screenshot
    await page.screenshot({ path: 'feature-18-redirect-success.png', fullPage: true });
    console.log('\n✓ Screenshot saved: feature-18-redirect-success.png');

    console.log('\n=== Feature #18: PASSING ✅ ===\n');
    console.log('All steps completed successfully:');
    console.log('  1. Protected page triggers login redirect ✓');
    console.log('  2. Login credentials accepted ✓');
    console.log('  3. Redirect to original destination ✓');
    console.log('  4. Session established ✓');

    return true;

  } catch (error) {
    console.error('\n=== Feature #18: FAILED ❌ ===');
    console.error('Error:', error.message);
    return false;

  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    await cleanup();
  }
}

testFeature18().then(success => {
  process.exit(success ? 0 : 1);
});
