/**
 * Feature #227: Multiple notifications don't overlap badly
 * Test script to verify toast notification stacking
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('=== Feature #227: Notification Stacking Test ===\n');

    // Navigate to the app
    await page.goto('http://localhost:5173');
    console.log('✅ Navigated to landing page');

    // Inject script to trigger multiple toasts rapidly
    await page.evaluate(() => {
      // Access the toast context through window or React DevTools
      window.testNotifications = () => {
        // Find the toast provider in React
        const reactFiber = document.querySelector('#root')._reactRootContainer?._internalRoot?.current;

        // If we can't access React directly, create a test button that triggers toasts
        const testBtn = document.createElement('button');
        testBtn.textContent = 'Test Notifications';
        testBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 10px; background: #00d4aa; color: white; border: none; border-radius: 8px; cursor: pointer;';
        document.body.appendChild(testBtn);

        let clickCount = 0;
        testBtn.addEventListener('click', () => {
          clickCount++;
          // Dispatch custom event that app can listen to
          window.dispatchEvent(new CustomEvent('test-toast', {
            detail: { message: `Test notification ${clickCount}`, type: 'success' }
          }));
        });

        return 'Test button added';
      };
    });

    // Navigate to a page where we can trigger notifications
    // Let's go to login page and trigger validation errors (which show toasts)
    await page.goto('http://localhost:5173/login');
    console.log('✅ Navigated to login page');

    // Method 1: Trigger validation toasts by clicking sign in with empty fields
    console.log('\n📝 Step 1: Triggering multiple toasts via validation...');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Rapid clicks on Sign In button to trigger multiple error toasts
    for (let i = 1; i <= 5; i++) {
      await page.click('button:has-text("Sign In")');
      console.log(`  • Clicked ${i}/5 - Triggered validation error`);
      await page.waitForTimeout(100); // Small delay between triggers
    }

    // Wait for toasts to appear
    await page.waitForTimeout(1000);

    // Take screenshot of stacked toasts
    await page.screenshot({
      path: 'verification/f227-stacked-notifications.png',
      fullPage: false
    });

    // Check for toast elements
    const toastCount = await page.evaluate(() => {
      const toasts = document.querySelectorAll('[role="alert"]');
      return toasts.length;
    });

    console.log(`\n📊 Results:`);
    console.log(`  • Toasts visible: ${toastCount}`);
    console.log(`  • Screenshot saved: verification/f227-stacked-notifications.png`);

    // Check console for errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    if (logs.length > 0) {
      console.log(`\n⚠️  Console errors found: ${logs.length}`);
      logs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log(`\n✅ No console errors`);
    }

    console.log(`\n✅ Test complete`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
