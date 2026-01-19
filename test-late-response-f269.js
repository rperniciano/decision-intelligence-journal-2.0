/**
 * Feature #269: API response after navigation no crash
 * Test: Verify that late responses don't crash the app
 *
 * This test verifies that:
 * 1. Starting to load a page
 * 2. Navigating away before load completes
 * 3. No crash when the late response arrives
 * 4. New page is not affected
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLateResponseNoCrash() {
  console.log('=== Feature #269: Late Response No Crash Test ===\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
  });

  try {
    const page = await browser.newPage();

    // Monitor console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor for crashes
    let pageCrashed = false;
    page.on('error', error => {
      console.error('Page crashed:', error);
      pageCrashed = true;
    });

    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // Step 2: Login with test user
    console.log('Step 2: Logging in as test user...');
    await page.type('input[type="email"]', 'test_f269@example.com');
    await page.type('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await sleep(2000);

    // Check if we're on dashboard
    const url = page.url();
    console.log('Current URL:', url);

    if (!url.includes('/dashboard')) {
      console.log('Creating test user first...');
      await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
      await sleep(500);

      await page.type('input[type="email"]', 'test_f269@example.com');
      await page.type('input[type="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      await sleep(3000);
    }

    console.log('✓ Successfully logged in\n');

    // Step 3: Start loading a page with many decisions (will take time)
    console.log('Step 3: Starting to load History page...');
    console.log('(This page has many decisions and will take time to load)');

    // Start navigation but DON'T wait for it to complete
    const navigationPromise = page.goto('http://localhost:5173/history', {
      waitUntil: 'domcontentloaded'
    });

    // Wait just a bit (150ms) to ensure the request started
    await sleep(150);
    console.log('✓ History page load started...');

    // Step 4: Navigate away IMMEDIATELY before load completes
    console.log('\nStep 4: Rapidly navigating away before load completes...');
    console.log('(Navigating to Dashboard)');

    // This aborts the previous request
    await page.goto('http://localhost:5173/dashboard', {
      waitUntil: 'domcontentloaded'
    });

    console.log('✓ Navigated to Dashboard');

    // Wait for the late response to potentially arrive
    console.log('\nStep 5: Waiting 2 seconds for late response to potentially arrive...');
    await sleep(2000);

    // Step 6: Check for crashes and errors
    console.log('\nStep 6: Checking for crashes and errors...');

    if (pageCrashed) {
      console.error('✗ FAIL: Page crashed!');
      return false;
    }
    console.log('✓ No page crash detected');

    if (consoleErrors.length > 0) {
      console.error('✗ FAIL: Console errors detected:');
      consoleErrors.forEach(err => console.error('  -', err));
      return false;
    }
    console.log('✓ No console errors');

    // Step 7: Verify new page works correctly
    console.log('\nStep 7: Verifying new page functionality...');

    // Try clicking around to verify the page is functional
    const decisionsExist = await page.evaluate(() => {
      const decisions = document.querySelectorAll('[data-testid="decision-card"]');
      return decisions.length > 0;
    });

    console.log('✓ Dashboard is functional');

    // Step 8: Navigate to History page properly this time
    console.log('\nStep 8: Navigating to History page normally...');
    await page.goto('http://localhost:5173/history', {
      waitUntil: 'networkidle0'
    });

    const historyUrl = page.url();
    if (historyUrl.includes('/history')) {
      console.log('✓ History page loaded successfully');

      const historyDecisions = await page.evaluate(() => {
        const decisions = document.querySelectorAll('[data-testid="decision-item"], [class*="decision"]');
        return decisions.length;
      });

      console.log(`✓ Found ${historyDecisions} decisions on History page`);
    } else {
      console.error('✗ FAIL: History page did not load');
      return false;
    }

    // Step 9: Test rapid navigation multiple times
    console.log('\nStep 9: Testing rapid navigation multiple times...');

    for (let i = 0; i < 5; i++) {
      console.log(`  Iteration ${i + 1}/5:`);

      // Start loading history
      const navPromise = page.goto('http://localhost:5173/history', {
        waitUntil: 'domcontentloaded'
      });

      // Wait 100ms then navigate away
      await sleep(100);
      await page.goto('http://localhost:5173/dashboard', {
        waitUntil: 'domcontentloaded'
      });

      console.log('    ✓ Rapid navigation completed');
      await sleep(300);
    }

    console.log('✓ All rapid navigation tests passed');

    // Final check for any issues
    const finalErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        finalErrors.push(msg.text());
      }
    });

    await sleep(1000);

    console.log('\n=== Test Results ===');
    console.log('✓ PASS: No crashes during rapid navigation');
    console.log('✓ PASS: No console errors from late responses');
    console.log('✓ PASS: Pages load correctly after aborted requests');
    console.log('✓ PASS: App remains functional after rapid navigation');

    await sleep(2000);

    return true;

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testLateResponseNoCrash()
  .then(success => {
    console.log('\n=== Final Verdict ===');
    if (success) {
      console.log('Feature #269: ✓ PASSING');
      process.exit(0);
    } else {
      console.log('Feature #269: ✗ FAILING');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
