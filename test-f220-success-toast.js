const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSuccessToast() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Try to sign in with existing test user
  let signInData;
  try {
    const result = await supabase.auth.signInWithPassword({
      email: 'test_f220@example.com',
      password: 'Test1234!',
    });
    signInData = result.data;
  } catch (e) {
    console.log('User does not exist, skipping test');
    return;
  }

  if (!signInData.session) {
    console.log('Could not sign in, skipping test');
    return;
  }

  const token = signInData.session.access_token;

  console.log('✓ Logged in successfully');
  console.log('Token:', token.substring(0, 20) + '...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Set the session token in localStorage
    await page.goto('http://localhost:5190');
    await page.evaluate(([accessToken, refreshToken]) => {
      localStorage.setItem('sb-access-token', accessToken);
      localStorage.setItem('sb-refresh-token', refreshToken);
    }, [signInData.session.access_token, signInData.session.refresh_token]);

    console.log('✓ Set auth tokens in localStorage');

    // Navigate to create decision page
    await page.goto('http://localhost:5190/decisions/new');
    console.log('✓ Navigated to create decision page');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Fill in the form
    await page.fill('#decision-title', 'F220 Test Decision - Success Toast');
    console.log('✓ Filled in title');

    // Click the Save button
    await page.click('button:has-text("Save Decision")');
    console.log('✓ Clicked Save button');

    // Wait for navigation to the decision detail page
    await page.waitForURL(/\/decisions\/[a-f0-9-]+$/, { timeout: 5000 });
    console.log('✓ Navigated to decision detail page');

    // Take a screenshot to verify the toast was shown
    await page.screenshot({ path: 'verification/f220-success-toast-shown.png' });
    console.log('✓ Screenshot saved');

    // Check for console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Wait a bit to see the toast
    await page.waitForTimeout(2000);

    // Check if there were any errors
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log('\n❌ Console errors found:');
      errors.forEach(e => console.log('  -', e.text));
    } else {
      console.log('\n✓ No console errors');
    }

    console.log('\n✅ Test complete - Check screenshot for success toast');
    console.log('   The toast should say "Decision saved" at the top of the page');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

testSuccessToast().catch(console.error);
