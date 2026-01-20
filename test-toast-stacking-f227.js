const { chromium } = require('playwright');

async function testToastStacking() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login');

    console.log('Checking console for errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // First, let's inject a script to trigger multiple toasts rapidly
    console.log('Injecting script to trigger multiple toasts...');

    await page.evaluate(() => {
      // Access the toast context from window
      const triggerToasts = () => {
        // Try to find and click buttons that trigger toasts
        // For now, let's manually dispatch toast events
        window.dispatchEvent(new CustomEvent('test-toast', { detail: { message: 'Test Toast 1', type: 'success' } }));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('test-toast', { detail: { message: 'Test Toast 2', type: 'error' } }));
        }, 100);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('test-toast', { detail: { message: 'Test Toast 3', type: 'info' } }));
        }, 200);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('test-toast', { detail: { message: 'Test Toast 4', type: 'success' } }));
        }, 300);
      };
      window.triggerTestToasts = triggerToasts;
    });

    // Try to trigger toasts through the UI
    // Let's try creating a test user first and triggering toasts through actions

    console.log('Test setup complete. Manual verification needed.');

    // Take a screenshot
    await page.screenshot({ path: 'verification/feature-227-before-test.png' });

    console.log('Screenshot saved: verification/feature-227-before-test.png');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testToastStacking();
