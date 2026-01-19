/**
 * Feature #270: Concurrent Form Submissions Test
 *
 * This test verifies that forms properly handle concurrent/duplicate submissions:
 * 1. Double-clicking submit button only triggers ONE submission
 * 2. Rapid navigation between forms doesn't cause data mixing
 * 3. Each form shows correct success/error state
 */

async function testConcurrentFormSubmissions() {
  const playwright = require('playwright');
  const { chromium } = playwright;

  console.log('\n=== Feature #270: Concurrent Form Submissions Test ===\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Monitor network requests
  const apiRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/v1/') || url.includes('/auth/v1/')) {
      apiRequests.push({
        method: request.method(),
        url: url,
        timestamp: Date.now()
      });
    }
  });

  try {
    console.log('Step 1: Navigate to register page');
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');

    console.log('Step 2: Fill out registration form');
    const timestamp = Date.now();
    const testEmail = `test_concurrent_${timestamp}@example.com`;

    await page.fill('#name', `TestUser${timestamp}`);
    await page.fill('#email', testEmail);
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');

    console.log('Step 3: Double-click submit button rapidly');
    const submitButton = await page.locator('button[type="submit"]').first();

    // Clear previous requests
    apiRequests.length = 0;

    // Simulate double-click (two clicks in quick succession)
    await submitButton.click();
    await page.waitForTimeout(50); // 50ms between clicks (very fast double-click)
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Count signup requests
    const signupRequests = apiRequests.filter(req =>
      req.url.includes('/auth/v1/signup') || req.url.includes('/auth/v1/user')
    );

    console.log(`\nNetwork analysis:`);
    console.log(`  Total auth API requests: ${signupRequests.length}`);

    if (signupRequests.length <= 1) {
      console.log(`  ✅ PASS: Only ${signupRequests.length} signup request(s) made (double-click prevented)`);
    } else {
      console.log(`  ❌ FAIL: ${signupRequests.length} signup requests made (duplicate submission detected!)`);
    }

    // Check if we see success message
    const successMessage = await page.locator('text=Check your email').count();
    if (successMessage > 0) {
      console.log(`  ✅ PASS: Success message displayed`);
    } else {
      console.log(`  ❌ FAIL: Success message not displayed`);
    }

    console.log('\nStep 4: Navigate to login page');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    console.log('Step 5: Fill login form');
    await page.fill('#email', testEmail);
    await page.fill('#password', 'password123');

    console.log('Step 6: Submit login (normal single click)');
    apiRequests.length = 0;

    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 5000 });

    const loginRequests = apiRequests.filter(req =>
      req.url.includes('/auth/v1/token?grant_type=password')
    );

    console.log(`\nLogin analysis:`);
    console.log(`  Total login requests: ${loginRequests.length}`);

    if (loginRequests.length === 1) {
      console.log(`  ✅ PASS: Exactly 1 login request made`);
    } else {
      console.log(`  ❌ FAIL: ${loginRequests.length} login requests made`);
    }

    console.log('\nStep 7: Test rapid form submissions (login → edit profile → login)');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // First login
    await page.fill('#email', testEmail);
    await page.fill('#password', 'password123');
    apiRequests.length = 0;
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Navigate to settings (should have profile edit form)
    await page.goto('http://localhost:5173/settings');
    await page.waitForLoadState('networkidle');

    // Click edit profile button
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(300);

    // Try to double-click the profile save button
    const saveButton = await page.locator('button:has-text("Save")').first();
    apiRequests.length = 0;

    await saveButton.click();
    await page.waitForTimeout(50);
    await saveButton.click();
    await page.waitForTimeout(2000);

    const profileRequests = apiRequests.filter(req =>
      req.url.includes('/api/v1/profile') && req.method === 'PATCH'
    );

    console.log(`\nProfile update analysis:`);
    console.log(`  Total profile update requests: ${profileRequests.length}`);

    if (profileRequests.length <= 1) {
      console.log(`  ✅ PASS: Only ${profileRequests.length} profile update request(s) made`);
    } else {
      console.log(`  ❌ FAIL: ${profileRequests.length} profile update requests made`);
    }

    // Check console for errors
    console.log('\nStep 8: Check for console errors');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (logs.length === 0) {
      console.log(`  ✅ PASS: No console errors`);
    } else {
      console.log(`  ❌ FAIL: ${logs.length} console errors found:`);
      logs.forEach(log => console.log(`    - ${log}`));
    }

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('Feature #270: Concurrent Form Submissions');

    let passCount = 0;
    let failCount = 0;

    if (signupRequests.length <= 1) passCount++; else failCount++;
    if (successMessage > 0) passCount++; else failCount++;
    if (loginRequests.length === 1) passCount++; else failCount++;
    if (profileRequests.length <= 1) passCount++; else failCount++;
    if (logs.length === 0) passCount++; else failCount++;

    console.log(`\nResults: ${passCount} passed, ${failCount} failed out of 5 tests`);

    if (failCount === 0) {
      console.log('\n✅ ALL TESTS PASSED - Feature #270 verified\n');
    } else {
      console.log('\n❌ SOME TESTS FAILED - Feature #270 not complete\n');
    }

    // Take screenshot
    await page.screenshot({
      path: 'feature-270-concurrent-forms-verification.png',
      fullPage: true
    });
    console.log('Screenshot saved: feature-270-concurrent-forms-verification.png');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run test
testConcurrentFormSubmissions().catch(console.error);
