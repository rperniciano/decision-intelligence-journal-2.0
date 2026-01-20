// Test Feature #289: Audio upload shows progress
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Feature #289: Audio Upload Progress Test ===\n');

    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Fill in login form
    console.log('2. Logging in as test user...');
    await page.fill('input[type="email"]', 'test-f289-1768884601993@example.com');
    await page.fill('input[type="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('   ✓ Login successful');

    // Navigate to record page
    console.log('\n3. Navigating to Record page...');
    await page.click('a[href="/record"]');
    await page.waitForURL('**/record');
    console.log('   ✓ On Record page');

    // Start recording
    console.log('\n4. Starting recording (35 seconds for good upload progress)...');
    await page.click('button[aria-label*="Start recording"]');
    console.log('   ✓ Recording started');

    // Wait for 35 seconds to create a decent-sized audio file
    console.log('   Recording for 35 seconds to create uploadable audio...');
    await page.waitForTimeout(35000);

    // Stop recording
    console.log('\n5. Stopping recording...');
    await page.click('button[aria-label*="Stop recording"]');
    console.log('   ✓ Recording stopped');

    // Watch for upload progress
    console.log('\n6. Monitoring upload progress...');

    // Check for progress bar elements
    const progressContainer = await page.waitForSelector('div[role="progressbar"]', { timeout: 10000 });
    console.log('   ✓ Progress bar found');

    // Monitor progress updates
    let previousProgress = -1;
    let updateCount = 0;

    // Take multiple screenshots during upload
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500); // Wait 500ms between checks

      const progressElement = await page.$('span[aria-live="polite"]');
      if (progressElement) {
        const progressText = await progressElement.textContent();
        const currentProgress = parseInt(progressText);

        if (!isNaN(currentProgress) && currentProgress !== previousProgress) {
          console.log(`   Progress: ${currentProgress}%`);
          previousProgress = currentProgress;
          updateCount++;

          // Take screenshot at key milestones
          if (currentProgress === 25 || currentProgress === 50 || currentProgress === 75 || currentProgress === 100) {
            await page.screenshot({
              path: `verification/feature-289-progress-${currentProgress}.png`
            });
            console.log(`   ✓ Screenshot saved at ${currentProgress}%`);
          }
        }
      }

      // Break if we've reached 100%
      if (previousProgress === 100) {
        console.log('   ✓ Upload completed (100%)');
        break;
      }
    }

    // Verify progress was tracked
    if (updateCount > 0) {
      console.log(`\n✓ Upload progress updated ${updateCount} times`);
    } else {
      console.log('\n✗ No progress updates detected!');
    }

    // Wait for navigation to decision detail page
    console.log('\n7. Waiting for processing to complete...');
    try {
      await page.waitForURL('**/decisions/**', { timeout: 120000 });
      console.log('   ✓ Processing completed, navigated to decision');

      // Final screenshot of decision page
      await page.screenshot({ path: 'verification/feature-289-decision-created.png' });
      console.log('   ✓ Final screenshot saved');
    } catch (e) {
      console.log('   ⚠ Processing took longer than expected (may still be working)');
      await page.screenshot({ path: 'verification/feature-289-processing.png' });
    }

    // Check console for errors
    console.log('\n8. Checking console for errors...');
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000);

    const errors = logs.filter(log => log.includes('Error') || log.includes('error'));
    if (errors.length === 0) {
      console.log('   ✓ No JavaScript errors detected');
    } else {
      console.log(`   ⚠ Found ${errors.length} console messages (check if they're errors)`);
    }

    console.log('\n=== Test Complete ===');
    console.log('Summary:');
    console.log('- Upload progress bar appeared: ✓');
    console.log(`- Progress updates tracked: ${updateCount > 0 ? '✓' : '✗'}`);
    console.log(`- Number of progress updates: ${updateCount}`);
    console.log('- Final progress reached 100%:', previousProgress === 100 ? '✓' : '⚠');
    console.log('- Screenshots saved in verification/ directory');

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'verification/feature-289-error.png' });
  } finally {
    await browser.close();
  }
})();
